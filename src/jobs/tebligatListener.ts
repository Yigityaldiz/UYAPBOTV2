import cron from "node-cron";
import { findOldestUnprocessedTebligatlar } from "../services/emailService";
import { processSingleTebligat } from "../core/TebligatProcessor"; // <-- Yeni işlemcimizi import ediyoruz

/**
 * Bu ana fonksiyon, her gün belirli bir saatte çalışarak yeni tebligatları bulur
 * ve işlenmesi için tebligatProcessor'a gönderir.
 */
export function startTebligatListener() {
  console.log("Tebligat Dinleyici Kuruldu.");

  // Canlı kullanım: Her gün sabah 9'da çalışır ('0 9 * * *')
  // Test için: Her 2 dakikada bir çalıştırmak için '*/2 * * * *'
  cron.schedule(
    "*/2 * * * *",
    async () => {
      console.log(
        `\n--- GÜNLÜK TEBLİGAT KONTROLÜ BAŞLATILDI: ${new Date().toLocaleString()} ---`
      );

      // Sadece 'okunmamış' en eski 3 tebligatı bul
      const tebligatlarToProcess = await findOldestUnprocessedTebligatlar(3);

      if (tebligatlarToProcess.length === 0) {
        console.log("İşlenecek yeni tebligat bulunamadı.");
        return;
      }

      console.log(
        `İşlenmek üzere ${tebligatlarToProcess.length} adet tebligat bulundu.`
      );

      // Her bir tebligatı işlenmesi için işlemciye gönder
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
