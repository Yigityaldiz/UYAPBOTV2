import DeepSeekService from "../services/deepSeekService";

/**
 * Verilen bir PDF metnini analiz eder ve yapılandırılmış JSON verisi çıkarır.
 * @param pdfText - PDF'ten okunan tam metin.
 * @returns {Promise<any>} - Analiz edilmiş JSON verisi.
 */
export async function analyzePdfTextWithAI(pdfText: string): Promise<any> {
  const prompt = `
Aşağıdaki metin, bir UYAP tebligatına aittir. Bu metinden aşağıdaki bilgileri çıkarıp JSON formatında bir cevap ver:
- mahkemeAdi (Örnek: "Tarsus 1. Asliye Hukuk Mahkemesi")
- dosyaNo (Örnek: "2024/223")
- kararNo (Varsa, Örnek: "2024/112")
- tebligKonusu (Metnin genel amacı, Örnek: "İstinaf Başvurusunun Tebliği")
- sonTarih (Eğer bir süre belirtilmişse, örn: "1 Hafta", "2 Hafta", "15 Gün")
- durusmaTarihi (Eğer bir duruşma tarihi varsa, "gg.aa.yyyy" formatında)

Eğer bir bilgiyi bulamazsan, değerini "yok" olarak belirt. Cevabın sadece ve sadece JSON objesi olsun, başka hiçbir metin veya formatlama ekleme.

# METİN:
${pdfText}
  `;

  try {
    const response = await DeepSeekService.chatCompletion(prompt, {
      systemMessage:
        "Sen, hukuki belgelerden yapılandırılmış JSON verisi çıkaran bir yapay zeka asistanısın.",
      temperature: 0.0,
    });
    console.log("--- PDF ANALİZ SONUCU (HAM)---");
    console.log(response);

    // AI'ın cevabının başındaki ve sonundaki ```json ve ``` kısımlarını temizliyoruz.
    const cleanResponse = response
      .replace(/^```json\s*/, "")
      .replace(/\s*```$/, "");

    return JSON.parse(cleanResponse); // Artık temizlenmiş cevabı parse ediyoruz.
  } catch (error) {
    console.error("PDF analizi sırasında yapay zeka hatası oluştu:", error);
    return null;
  }
}

/**
 * Verilen metin listesi içinde, hedef barkod numarasına sahip tebligatın
 * kaçıncı sırada olduğunu bulmak için yapay zekaya sorar.
 * @param allRowTexts - Sayfadan taranan tüm satırların metin içerikleri.
 * @param targetBarcode - E-postadan alınan hedef barkod numarası.
 * @returns {Promise<number>} - Bulunan satırın numarası (1'den başlar) veya bulunamazsa 0.
 */
export async function findRowNumberWithAI(
  allRowTexts: string[],
  targetBarcode: string
): Promise<number> {
  const formattedList = allRowTexts
    .map((text, index) => `Satır ${index + 1}: ${text}`)
    .join("\n");

  const prompt = `
Aşağıda bir e-tebligat listesinin metin dökümü bulunmaktadır. Senin görevin, bu listede, barkod numarası "${targetBarcode}" olan tebligatın kaçıncı satırda olduğunu bulmaktır.

# E-Tebligat Listesi:
${formattedList}

# Soru:
Yukarıdaki listede, "${targetBarcode}" barkod numarasına sahip tebligat kaçıncı sıradadır?

# Cevap Formatı:
Sadece ve sadece sıra numarasını bir sayı olarak ver. Örneğin: 3. Eğer listede bu barkod numarasını bulamazsan "0" yaz.
  `;

  try {
    console.log("Yapay zekaya satır numarası soruluyor...");
    const response = await DeepSeekService.chatCompletion(prompt, {
      systemMessage:
        "Sen, metin içindeki bilgileri bulan bir veri analizi asistanısın. Cevapların her zaman kısa, net ve sadece istenen formatta olmalı.",
      temperature: 0.0,
    });

    console.log(`Yapay zekadan gelen ham cevap: "${response}"`);
    const rowNumber = parseInt(response.trim(), 10);

    if (isNaN(rowNumber)) {
      console.error("Yapay zeka geçerli bir sayı döndürmedi. Cevap:", response);
      return 0;
    }

    return rowNumber;
  } catch (error) {
    console.error(
      "Sıra numarası analizi sırasında yapay zeka hatası oluştu:",
      error
    );
    return 0;
  }
}
