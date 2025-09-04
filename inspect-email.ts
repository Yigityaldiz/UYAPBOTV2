// inspect-email.ts
require("dotenv").config();
import imaps from "imap-simple";

const config = {
  imap: {
    user: process.env.IMAP_USER!,
    password: process.env.IMAP_PASSWORD!,
    host: process.env.IMAP_HOST!,
    port: parseInt(process.env.IMAP_PORT || "993", 10),
    tls: true,
    tlsOptions: { rejectUnauthorized: false },
  },
};

async function inspectEmailByUid(uid: number) {
  if (!uid) {
    console.error(
      "Lütfen bir UID numarası belirtin. Örnek: npx ts-node inspect-email.ts 10028"
    );
    return;
  }
  console.log(`${uid} UID'li e-posta inceleniyor...`);

  try {
    const connection = await imaps.connect(config);
    await connection.openBox("INBOX");

    // Sadece belirtilen UID'ye sahip mesajı ara
    const messages = await connection.search([["UID", uid.toString()]], {
      bodies: ["TEXT"],
    });

    if (messages.length === 0) {
      console.log(`${uid} UID'li e-posta bulunamadı.`);
    } else {
      const textPart = messages[0].parts.find(
        (part) => part.which === "TEXT"
      )?.body;
      console.log(`\n--- ${uid} UID'li E-POSTA İÇERİĞİ ---\n`);
      console.log(textPart);
      console.log("\n--- İÇERİK SONU ---\n");
    }
    connection.end();
  } catch (error) {
    console.error("E-posta incelenirken hata:", error);
  }
}

// Komut satırından verilen UID'yi alıyoruz
const uidToInspect = parseInt(process.argv[2], 10);
inspectEmailByUid(uidToInspect);
