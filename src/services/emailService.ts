import "dotenv/config";
import imaps, { ImapSimple } from "imap-simple";
import qp from "quoted-printable";
import iconv from "iconv-lite";

const SENDER_2FA = "uets@bilgi.ptt.gov.tr";
const SUBJECT_2FA = "UETS Giriş Doğrulama";
const SENDER_TEBLIGAT = "uets@bilgi.ptt.gov.tr";
const SUBJECT_TEBLIGAT = "Yeni Elektronik Tebligat";

function getMsgDate(attrs: any): Date {
  const v = attrs?.internalDate ?? attrs?.date;
  return new Date(v);
}

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

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function decodeAndNormalizeBody(raw: string): string {
  if (!raw) return "";
  const mCharset = raw.match(/charset\s*=\s*"?([\w\-]+)"?/i);
  const charset = (mCharset?.[1] || "utf-8").toLowerCase();
  const looksQP =
    /Content-Transfer-Encoding:\s*quoted-printable/i.test(raw) ||
    /=0A|=3D|=\r?\n/i.test(raw);
  let decoded = raw;
  try {
    if (looksQP) {
      const buf = Buffer.from(qp.decode(raw));
      decoded = iconv.decode(buf, charset);
    }
  } catch (error) {
    console.error("Metin decode edilirken hata:", error);
  }
  return decoded
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<\/?[^>]+>/g, " ")
    .replace(/&nbsp;?/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractBarcodeFromText(raw: string): string | null {
  if (!raw) return null;
  let m = raw.match(/tarafından\s+(\d{13,})\s*barkod/i);
  if (m) return m[1];
  m = raw.match(/(\d{10,})\s*barkod/i);
  if (m) return m[1];
  const all = [...raw.matchAll(/(\d{10,})/g)].map((x) => x[0]);
  return all.length ? all.sort((a, b) => b.length - a.length)[0] : null;
}

export type UetsMail = {
  uid: number;
  date: Date;
  barcode: string;
  from: string;
  subject: string;
  bodyRaw: string;
  body: string;
};

export async function getLatestUetsCode(
  sinceDate: Date
): Promise<string | null> {
  let connection: ImapSimple | undefined;
  try {
    await delay(10000);
    for (let i = 0; i < 4; i++) {
      console.log(
        `2FA e-postası aranıyor (sadece ${sinceDate.toLocaleTimeString()} sonrası)... Deneme ${
          i + 1
        }`
      );
      connection = await imaps.connect(config);
      await connection.openBox("INBOX");
      const searchCriteria = [
        ["SINCE", sinceDate.toISOString()],
        ["FROM", SENDER_2FA],
        ["SUBJECT", SUBJECT_2FA],
      ];
      const messages = await connection.search(searchCriteria, {
        bodies: ["TEXT"],
      });

      if (messages.length > 0) {
        const latestMessage = messages[messages.length - 1];
        const textPart = latestMessage.parts.find(
          (part) => part.which === "TEXT"
        );
        if (textPart) {
          const codeMatch = textPart.body.match(/\d{6}/);
          if (codeMatch) {
            console.log(`✅ 2FA Kodu bulundu: ${codeMatch[0]}`);
            if (connection) await connection.end();
            return codeMatch[0];
          }
        }
      }
      if (connection) await connection.end();
      if (i < 3) {
        await delay(5000);
      }
    }
    console.error("❌ 2FA E-postası 4 deneme sonunda bulunamadı.");
    return null;
  } catch (error) {
    console.error(
      "2FA e-postası aranırken hata oluştu:",
      (error as Error).message
    );
    return null;
  } finally {
    if (connection && (connection as any)._conn?.connected) {
      await connection.end();
    }
  }
}

export async function findOldestUnprocessedTebligatlar(
  limit: number = 3
): Promise<UetsMail[]> {
  let connection: ImapSimple | undefined;
  try {
    connection = await imaps.connect(config);
    await connection.openBox("INBOX");
    const searchCriteria: any[] = [
      "UNSEEN",
      ["FROM", SENDER_TEBLIGAT],
      ["SUBJECT", SUBJECT_TEBLIGAT],
    ];
    const fetchOptions = { bodies: ["HEADER", "TEXT"], markSeen: false };
    const messages = await connection.search(searchCriteria, fetchOptions);
    const tebligatlar: UetsMail[] = [];

    const sortedMessages = messages.sort(
      (a: any, b: any) =>
        getMsgDate(a.attributes).getTime() - getMsgDate(b.attributes).getTime()
    );

    for (const msg of sortedMessages.slice(0, limit)) {
      const headerPart = msg.parts.find((p: any) => p.which === "HEADER");
      const textPart = msg.parts.find((p: any) => p.which === "TEXT");
      const header = headerPart?.body || {};
      const subject: string = (
        header.subject?.[0] ??
        header.Subject?.[0] ??
        ""
      ).trim();
      const from: string = (
        header.from?.[0] ??
        header.From?.[0] ??
        "unknown"
      ).trim();
      const bodyRaw = (textPart?.body ?? "").toString();
      const body = decodeAndNormalizeBody(bodyRaw);
      const barcode = extractBarcodeFromText(body);

      // Sadece barkodu olanları listeye ekleyelim
      if (barcode) {
        tebligatlar.push({
          uid: msg.attributes.uid,
          date: getMsgDate(msg.attributes),
          barcode,
          from,
          subject,
          bodyRaw,
          body,
        });
      }
    }
    return tebligatlar;
  } catch (error) {
    console.error("Tebligat e-postaları alınırken hata oluştu:", error);
    return [];
  } finally {
    if (connection && (connection as any)._conn?.connected) {
      await connection.end();
    }
  }
}

export async function markEmailAsProcessed(uid: number): Promise<void> {
  let connection: ImapSimple | undefined;
  try {
    connection = await imaps.connect(config);
    await connection.openBox("INBOX");
    const messagesToMark = await connection.search([["UID", uid.toString()]], {
      bodies: [],
    });
    if (messagesToMark.length > 0) {
      await connection.addFlags(
        messagesToMark.map((m) => m.attributes.uid),
        "\\Seen"
      );
      console.log(`E-posta UID ${uid} 'okundu' olarak işaretlendi.`);
    }
  } catch (error) {
    console.error(`E-posta ${uid} işaretlenirken hata:`, error);
  } finally {
    if (connection && (connection as any)._conn?.connected) {
      await connection.end();
    }
  }
}

/**
 * Gelen kutusundaki OKUNMUŞ tebligat bildirimlerini bulur,
 * tarihe göre EN YENİDEN ESKİYE sıralar ve belirtilen limitte geri döndürür.
 * @param limit - Getirilecek tebligat sayısı (örn: 5)
 */
export async function getLatestReadTebligatlar(
  limit: number = 5
): Promise<UetsMail[]> {
  let connection: ImapSimple | undefined;
  try {
    connection = await imaps.connect(config);
    await connection.openBox("INBOX");

    // Arama kriterini "okunmuş" (SEEN) olarak değiştiriyoruz.
    const searchCriteria: any[] = [
      "SEEN",
      ["FROM", SENDER_TEBLIGAT],
      ["SUBJECT", SUBJECT_TEBLIGAT],
    ];
    const fetchOptions = { bodies: ["HEADER", "TEXT"], markSeen: false };

    const messages = await connection.search(searchCriteria, fetchOptions);

    if (!messages?.length) {
      return [];
    }

    // Gelen mesajları EN YENİDEN ESKİYE doğru sıralıyoruz.
    const sorted = messages.sort(
      (a: any, b: any) =>
        getMsgDate(b.attributes).getTime() - getMsgDate(a.attributes).getTime()
    );

    const tebligatlar: UetsMail[] = [];

    // Sıralanmış listenin başından itibaren limiti kadarını alıyoruz.
    for (const msg of sorted.slice(0, limit)) {
      const headerPart = msg.parts.find((p: any) => p.which === "HEADER");
      const textPart = msg.parts.find((p: any) => p.which === "TEXT");
      const header = headerPart?.body || {};
      const subject: string = (
        header.subject?.[0] ??
        header.Subject?.[0] ??
        ""
      ).trim();
      const from: string = (
        header.from?.[0] ??
        header.From?.[0] ??
        "unknown"
      ).trim();
      const bodyRaw = (textPart?.body ?? "").toString();
      const body = decodeAndNormalizeBody(bodyRaw);
      const barcode = extractBarcodeFromText(body);

      if (barcode) {
        tebligatlar.push({
          uid: msg.attributes.uid,
          date: getMsgDate(msg.attributes),
          barcode,
          from,
          subject,
          bodyRaw,
          body,
        });
      }
    }
    return tebligatlar;
  } catch (error) {
    console.error("Okunmuş tebligatlar aranırken hata:", error);
    return [];
  } finally {
    if (connection && (connection as any)._conn?.connected) {
      await connection.end();
    }
  }
}
