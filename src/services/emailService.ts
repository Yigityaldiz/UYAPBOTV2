// src/services/emailService.ts

require("dotenv").config();
import imaps from "imap-simple";

const config = {
  imap: {
    user: process.env.IMAP_USER!,
    password: process.env.IMAP_PASSWORD!,
    host: process.env.IMAP_HOST!,
    // --- DÜZELTME BURADA ---
    // .env'den gelen port numarasını metinden sayıya çeviriyoruz.
    port: parseInt(process.env.IMAP_PORT || '993', 10),
    tls: true,
    tlsOptions: { rejectUnauthorized: false },
  },
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function getLatestUetsCode(sinceDate: Date): Promise<string | null> {
  // Fonksiyonun geri kalanı tamamen aynı, hiçbir değişiklik yok.
  console.log('E-postanın gelmesi için başlangıç beklemesi eklendi...');
  await delay(10000);
  for (let i = 0; i < 4; i++) {
    console.log(`E-posta aranıyor (sadece ${sinceDate.toLocaleTimeString()} sonrası)... Deneme ${i + 1}`);
    try {
      // imaps.connect(config) artık doğru tipte veri alacak.
      const connection = await imaps.connect(config); 
      await connection.openBox("INBOX");
      const searchCriteria = [
        ['SINCE', sinceDate.toISOString()],
        ['FROM', 'uets@bilgi.ptt.gov.tr'],
        ['SUBJECT', 'UETS Giriş Doğrulama'],
      ];
      const messages = await connection.search(searchCriteria, { bodies: ["TEXT"] });
      connection.end();
      if (messages.length > 0) {
        const latestMessage = messages[messages.length - 1];
        const textPart = latestMessage.parts.find((part) => part.which === "TEXT");
        if (textPart) {
          const codeMatch = textPart.body.match(/\d{6}/);
          if (codeMatch) {
            console.log(`✅ Doğrulama kodu bulundu: ${codeMatch[0]}`);
            return codeMatch[0];
          }
        }
      }
    } catch (error) {
      console.error(`Deneme ${i + 1} başarısız:`, (error as Error).message);
    }
    if (i < 3) { await delay(5000); }
  }
  console.error('❌ E-posta 4 deneme sonunda bulunamadı.');
  return null;
}