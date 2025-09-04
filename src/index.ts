import { runAutomation } from "./core/automation";
import { analyzePdfTextWithAI } from "./core/ai";
import { getLatestReadTebligatlar, UetsMail } from "./services/emailService"; // getLatestReadTebligatlar'ı import ediyoruz
import fs from "fs";
import path from "path";
import pdf from "pdf-parse";

async function main() {
  console.log("Uygulama başlatılıyor: En son okunan 3 tebligat işlenecek...");

  // 1. En son okunan 3 tebligat e-postasını bul
  const tebligatlarToProcess = await getLatestReadTebligatlar(3);

  if (!tebligatlarToProcess || tebligatlarToProcess.length === 0) {
    console.log("İşlenecek, önceden okunmuş bir tebligat bulunamadı.");
    return;
  }

  console.log(
    `İşlenmek üzere ${tebligatlarToProcess.length} adet okunmuş tebligat bulundu.`
  );

  // 2. Her bir tebligat için sırayla tüm süreci çalıştır
  for (const tebligat of tebligatlarToProcess) {
    console.log(`\n--- İŞLEM BAŞLIYOR: Barkod ${tebligat.barcode} ---`);

    if (!tebligat.barcode) {
      console.error(
        `UID ${tebligat.uid} olan e-postanın barkodu bulunamadı, bu tebligat atlanıyor.`
      );
      continue; // Bu tebligatı atla, döngüye bir sonrakiyle devam et.
    }

    // a. Otomasyonu çalıştır ve PDF dosyasının yolunu al
    const downloadedPdfPath = await runAutomation(tebligat.barcode);

    if (downloadedPdfPath && fs.existsSync(downloadedPdfPath)) {
      console.log(
        `PDF indirildi: ${downloadedPdfPath}, AI analizi başlıyor...`
      );

      // b. İndirilen PDF'i oku
      const dataBuffer = fs.readFileSync(downloadedPdfPath);
      const data = await pdf(dataBuffer);

      // c. AI ile analiz et
      const analysisResult = await analyzePdfTextWithAI(data.text);

      if (analysisResult) {
        console.log("✅ Analiz başarıyla tamamlandı.");
        // Sonraki adım: Bu sonucu (analysisResult) veritabanına kaydetmek.
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

  console.log("Tüm işlemler bitti.");
}

// Ana fonksiyonu çalıştır
main();
