import cron from "node-cron";
import {
  getLatestReadTebligatlar,
  markEmailAsProcessed,
  UetsMail,
} from "../services/emailService";
import { runAutomation } from "../core/automation";
import { analyzePdfTextWithAI } from "../core/ai";
import fs from "fs";
import pdf from "pdf-parse";
import Tebligat from "../models/Tebligat";

// Senin yazdığın mantığı, tek bir tebligatı işleyen bir fonksiyona çeviriyoruz.
async function processSingleTebligat(tebligat: UetsMail) {
  if (!tebligat.barcode) {
    console.error(
      `UID ${tebligat.uid} olan e-postanın barkodu bulunamadı, bu tebligat atlanıyor.`
    );
    // await markEmailAsProcessed(tebligat.uid); // Opsiyonel: Barkodsuzları da okundu sayabiliriz.
    return;
  }

  console.log(`\n--- İŞLEM BAŞLIYOR: Barkod ${tebligat.barcode} ---`);
  const downloadedPdfPath = await runAutomation(tebligat.barcode);

  if (downloadedPdfPath && fs.existsSync(downloadedPdfPath)) {
    console.log(`PDF indirildi: ${downloadedPdfPath}, AI analizi başlıyor...`);
    const dataBuffer = fs.readFileSync(downloadedPdfPath);
    const data = await pdf(dataBuffer);
    const analysisResult = await analyzePdfTextWithAI(data.text);

    if (analysisResult) {
      console.log(
        "✅ Analiz başarıyla tamamlandı. Veritabanına kaydediliyor..."
      );
      try {
        const newTebligatRecord = new Tebligat({
          barcode: tebligat.barcode,
          pdfPath: downloadedPdfPath,
          analysisResult: analysisResult,
        });
        await newTebligatRecord.save();
        console.log(
          `✅ Barkod ${tebligat.barcode} başarıyla veritabanına kaydedildi.`
        );
        await markEmailAsProcessed(tebligat.uid); // Her şey başarılı olunca okundu olarak işaretle.
      } catch (dbError) {
        console.error("Veritabanına kayıt sırasında hata:", dbError);
      }
    } else {
      console.error("❌ AI analizi başarısız oldu.");
    }
  } else {
    console.error(
      `❌ Otomasyon başarısız oldu, ${tebligat.barcode} barkodlu PDF indirilemedi.`
    );
  }
  console.log(`--- İŞLEM TAMAMLANDI: Barkod ${tebligat.barcode} ---\n`);
}

/**
 * Ana dinleyici. Belirli aralıklarla çalışarak tebligatları bulur ve işler.
 */
export function startTebligatListener() {
  console.log("Tebligat Dinleyici Kuruldu.");

  // Test için: Her 2 dakikada bir çalışır ('*/2 * * * *')
  // Canlı: Her sabah 9'da çalışır ('0 9 * * *')
  cron.schedule(
    "*/2 * * * *",
    async () => {
      console.log(
        `\n--- PERİYODİK KONTROL BAŞLATILDI: ${new Date().toLocaleString()} ---`
      );

      // Bu fonksiyonu test veya canlı moduna göre değiştirebiliriz.
      // Şimdilik test için en son okunan 3 tebligatı alıyoruz.
      const tebligatlarToProcess = await getLatestReadTebligatlar(3);

      if (!tebligatlarToProcess || tebligatlarToProcess.length === 0) {
        console.log("İşlenecek tebligat bulunamadı.");
        return;
      }

      console.log(
        `İşlenmek üzere ${tebligatlarToProcess.length} adet tebligat bulundu.`
      );

      for (const tebligat of tebligatlarToProcess) {
        await processSingleTebligat(tebligat);
      }

      console.log(`--- KONTROL TAMAMLANDI: ${new Date().toLocaleString()} ---`);
    },
    {
      timezone: "Europe/Istanbul",
    }
  );
}
