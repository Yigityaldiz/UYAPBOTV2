import cron from "node-cron";
import {
  findOldestUnprocessedTebligatlar,
  markEmailAsProcessed,
  UetsMail,
} from "../services/emailService";
import { runAutomation } from "../core/automation";
import { analyzePdfTextWithAI } from "../core/ai";
import fs from "fs";
import pdf from "pdf-parse";

async function processSingleTebligat(tebligat: UetsMail) {
  if (!tebligat.barcode) {
    console.error(
      `UID ${tebligat.uid} olan e-postada barkod bulunamadı, atlanıyor.`
    );
    await markEmailAsProcessed(tebligat.uid);
    return;
  }

  try {
    console.log(`İşlem başlıyor: Barkod ${tebligat.barcode}`);
    const downloadedPdfPath = await runAutomation(tebligat.barcode);

    if (downloadedPdfPath && fs.existsSync(downloadedPdfPath)) {
      console.log("PDF indirildi, AI analizi başlıyor...");
      const dataBuffer = fs.readFileSync(downloadedPdfPath);
      const data = await pdf(dataBuffer);
      const analysisResult = await analyzePdfTextWithAI(data.text);

      if (analysisResult) {
        console.log("✅ Analiz başarıyla tamamlandı.");
        // SONRAKİ ADIM: Bu sonucu (analysisResult) veritabanına kaydetmek.
        await markEmailAsProcessed(tebligat.uid);
      } else {
        console.error("❌ AI analizi başarısız oldu.");
      }
    } else {
      console.error("❌ Otomasyon başarısız oldu veya PDF indirilemedi.");
    }
  } catch (error) {
    console.error(
      `Barkod ${tebligat.barcode} işlenirken bir hata oluştu:`,
      error
    );
  }
}

export function startTebligatListener() {
  console.log("Tebligat Dinleyici Kuruldu.");

  // Her gün sabah 9'da çalışır ('0 9 * * *').
  cron.schedule(
    "0 9 * * *",
    async () => {
      console.log(
        `\n--- GÜNLÜK TEBLİGAT KONTROLÜ BAŞLATILDI: ${new Date().toLocaleString()} ---`
      );

      const tebligatlarToProcess = await findOldestUnprocessedTebligatlar(3);

      if (tebligatlarToProcess.length === 0) {
        console.log("İşlenecek yeni tebligat bulunamadı.");
        return;
      }

      console.log(
        `İşlenmek üzere ${tebligatlarToProcess.length} adet tebligat bulundu.`
      );

      for (const tebligat of tebligatlarToProcess) {
        await processSingleTebligat(tebligat);
      }

      console.log(
        `--- GÜNLÜK KONTROL TAMAMLANDI: ${new Date().toLocaleString()} ---`
      );
    },
    {
      timezone: "Europe/Istanbul",
    }
  );
}
