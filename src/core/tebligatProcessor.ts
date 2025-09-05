import { UetsMail, markEmailAsProcessed } from "../services/emailService";
import { runAutomation } from "./automation";
import { analyzePdfTextWithAI } from "./ai";
import fs from "fs";
import pdf from "pdf-parse";
import Tebligat from "../models/Tebligat";

/**
 * Bu fonksiyon, tek bir tebligat için tüm süreci (otomasyon, analiz, kaydetme) baştan sona yürütür.
 */
export async function processSingleTebligat(tebligat: UetsMail) {
  if (!tebligat.barcode) {
    console.error(
      `UID ${tebligat.uid} olan e-postada barkod bulunamadı, atlanıyor.`
    );
    // Barkodsuz e-postayı da okundu olarak işaretleyelim ki bir daha karşımıza çıkmasın.
    await markEmailAsProcessed(tebligat.uid);
    return;
  }

  try {
    console.log(`İşlem başlıyor: Barkod ${tebligat.barcode}`);
    // 1. Otomasyonu çalıştır ve PDF dosyasının yolunu al
    const downloadedPdfPath = await runAutomation(tebligat.barcode);

    if (downloadedPdfPath && fs.existsSync(downloadedPdfPath)) {
      console.log("PDF indirildi, AI analizi başlıyor...");

      // 2. İndirilen PDF'i oku
      const dataBuffer = fs.readFileSync(downloadedPdfPath);
      const data = await pdf(dataBuffer);

      // 3. AI ile analiz et
      const analysisResult = await analyzePdfTextWithAI(data.text);

      if (analysisResult) {
        console.log(
          "✅ Analiz başarıyla tamamlandı. Veritabanına kaydediliyor..."
        );

        // 4. Sonucu veritabanına kaydet
        const newTebligatRecord = new Tebligat({
          barcode: tebligat.barcode,
          pdfPath: downloadedPdfPath,
          analysisResult: analysisResult,
        });
        await newTebligatRecord.save();
        console.log(
          `✅ Barkod ${tebligat.barcode} başarıyla veritabanına kaydedildi.`
        );

        // 5. Her şey başarılıysa, e-postayı 'okundu' olarak işaretle.
        await markEmailAsProcessed(tebligat.uid);
      } else {
        console.error(
          "❌ AI analizi başarısız oldu. E-posta şimdilik 'okunmadı' olarak bırakılıyor."
        );
      }
    } else {
      console.error(
        "❌ Otomasyon başarısız oldu veya PDF indirilemedi. E-posta 'okunmadı' olarak bırakılıyor."
      );
    }
  } catch (error) {
    console.error(
      `Barkod ${tebligat.barcode} işlenirken bir hata oluştu:`,
      error
    );
  }
}
