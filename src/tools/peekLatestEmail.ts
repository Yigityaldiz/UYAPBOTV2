import "dotenv/config";
import { getLatestReadTebligatlar } from "../services/emailService";

(async () => {
  try {
    console.log("En son okunmuş 5 tebligat e-postası aranıyor...");

    const tebligatlar = await getLatestReadTebligatlar(5);

    if (!tebligatlar.length) {
      console.log("Okunmuş tebligat maili bulunamadı.");
      process.exit(0);
    }

    console.log(`En son okunmuş ${tebligatlar.length} tebligat bulundu:\n`);

    for (const mail of tebligatlar) {
      console.log("──────────────────────────────────");
      console.log(`Tarih  : ${mail.date.toLocaleString()}`);
      console.log(`Konu   : ${mail.subject}`);
      console.log(`Barkod : ${mail.barcode ?? "(bulunamadı)"}`);
    }
  } catch (err: any) {
    console.error("Script çalıştırılırken hata:", err?.message ?? err);
    process.exit(1);
  }
})();
