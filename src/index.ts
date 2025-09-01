// src/index.ts

import { runAutomation } from "./core/automation";
import { analyzePdfTextWithAI } from "./core/ai";
import fs from "fs";
import path from "path";
import pdf from "pdf-parse";

async function main() {
  console.log("Uygulama başlatılıyor...");

  // 1. Otomasyonu çalıştır ve PDF dosyasının yolunu al
  const downloadedPdfPath = await runAutomation();

  if (downloadedPdfPath) {
    console.log("PDF indirildi, AI analizi başlıyor...");

    // 2. PDF'i oku
    const dataBuffer = fs.readFileSync(downloadedPdfPath);
    const data = await pdf(dataBuffer);

    // 3. AI ile analiz et
    const analysisResult = await analyzePdfTextWithAI(data.text);

    if (analysisResult) {
      console.log("✅ Analiz başarıyla tamamlandı.");
      // Sonraki adım: Bu sonucu (analysisResult) veritabanına kaydetmek.
    } else {
      console.error("❌ AI analizi başarısız oldu.");
    }
  } else {
    console.error("❌ Otomasyon başarısız oldu, PDF indirilemedi.");
  }
}

main();
