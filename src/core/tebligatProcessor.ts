import { UetsMail, markEmailAsProcessed } from "../services/emailService";
import { runAutomation } from "./automation";
import { analyzePdfTextWithAI } from "./ai";
import { calculateDeadline } from "./rulesEngine";
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
    await markEmailAsProcessed(tebligat.uid);
    return;
  }

  try {
    console.log(`\n--- İŞLEM ${tebligat.barcode} ---`);
    const downloadedPdfPath = await runAutomation(tebligat.barcode);

    if (downloadedPdfPath && fs.existsSync(downloadedPdfPath)) {
      const dataBuffer = fs.readFileSync(downloadedPdfPath);
      const data = await pdf(dataBuffer);
      let analysisResult = await analyzePdfTextWithAI(data.text);

      if (analysisResult && analysisResult.tebligKonusu) {
        console.log("✅ Analiz başarıyla tamamlandı.");

        // --- KURAL MOTORU ADIMI ---
        console.log("\n--- KURAL MOTORU GİRDİSİ ---");
        console.log("AI'dan gelen tebligKonusu:", analysisResult.tebligKonusu);

        const serviceDate = new Date();
        const calculatedDeadline = calculateDeadline(
          analysisResult,
          serviceDate
        );

        if (calculatedDeadline) {
          const deadlineString = calculatedDeadline.toLocaleDateString("tr-TR");
          console.log(`Hesaplanan son tarih: ${deadlineString}`);
          analysisResult.sonTarih = deadlineString;
        }
        console.log("----------------------------\n");
        // --- KURAL MOTORU BİTTİ ---

        try {
          console.log("Veritabanına kayıt işlemi deneniyor...");
          const newTebligatRecord = new Tebligat({
            barcode: tebligat.barcode,
            pdfPath: downloadedPdfPath,
            analysisResult: analysisResult,
          });
          await newTebligatRecord.save();
          console.log(
            `✅ Barkod ${tebligat.barcode} başarıyla veritabanına kaydedildi.`
          );

          await markEmailAsProcessed(tebligat.uid);
        } catch (dbError) {
          console.error("!!! VERİTABANINA KAYIT SIRASINDA HATA YAKALANDI !!!");
          console.error(dbError);
        }
      } else {
        console.error(
          "❌ AI analizi başarısız oldu veya 'tebligKonusu' bulunamadı."
        );
      }
    } else {
      console.error("❌ Otomasyon başarısız oldu veya PDF indirilemedi.");
    }
  } catch (error) {
    console.error(
      `Barkod ${tebligat.barcode} işlenirken bir hata oluştu:`,
      error
    );
  } finally {
    console.log(`--- İŞLEM TAMAMLANDI: Barkod ${tebligat.barcode} ---\n`);
  }
}
