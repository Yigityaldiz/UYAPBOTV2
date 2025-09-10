import cron from "node-cron";
import { getLatestReadTebligatlar } from "../services/emailService";
import { processSingleTebligat } from "../core/tebligatProcessor";

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
