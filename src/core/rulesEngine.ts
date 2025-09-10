interface AnalysisResult {
  tebligKonusu: string;
  sonTarih?: string; // AI'ın bulduğu son tarih (string olabilir)
  durusmaTarihi?: string; // AI'ın bulduğu duruşma tarihi (string olabilir)
}

/**
 * AI analiz sonucuna ve tebellüğ tarihine göre yasal süreyi hesaplar.
 * @param analysisResult - Yapay zekanın PDF'ten çıkardığı veri.
 * @param serviceDate - Tebligatın işleme alındığı (tıklandığı) tarih.
 * @returns {Date | null} - Hesaplanan son tarihi veya null.
 */
export function calculateDeadline(
  analysisResult: AnalysisResult,
  serviceDate: Date
): Date | null {
  // Türkçe karakterler ve büyük/küçük harf farkları nedeniyle
  // esnek bir eşleşme için normalize ediyoruz.
  const normalize = (s: string) =>
    (s || "")
      .toLocaleLowerCase("tr-TR")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // diakritikleri sil
      .replace(/ı/g, "i"); // dotless i -> i

  const konu = normalize(analysisResult.tebligKonusu);
  let deadline: Date | null = null;

  // Kural 1 & 2: Bilirkişi Raporu veya İstinaf için 2 hafta
  if (konu.includes("bilirkisi") || konu.includes("istinaf")) {
    const newDate = new Date(serviceDate);
    newDate.setDate(newDate.getDate() + 14); // 2 hafta = 14 gün
    deadline = newDate;
    console.log("Kural uygulandı: Bilirkişi/İstinaf -> 14 gün eklendi.");
  }
  // Kural 3: Muhtıra için 1 hafta
  else if (konu.includes("muhtira")) {
    const newDate = new Date(serviceDate);
    newDate.setDate(newDate.getDate() + 7); // 1 hafta = 7 gün
    deadline = newDate;
    console.log("Kural uygulandı: Muhtıra -> 7 gün eklendi.");
  }
  // Kural 4: Yargıtay Kararı için 1 ay
  else if (konu.includes("yargitay karari") || konu.includes("yargitay")) {
    const newDate = new Date(serviceDate);
    newDate.setMonth(newDate.getMonth() + 1); // 1 ay
    deadline = newDate;
    console.log("Kural uygulandı: Yargıtay Kararı -> 1 ay eklendi.");
  }

  // Eğer AI metinden bir tarih bulduysa, onu da değerlendirebiliriz
  // Ama şimdilik öncelik bizim kurallarımızda.

  if (!deadline) {
    console.log(
      "Kural bulunamadı. Konu (normalize):",
      konu || "(boş)"
    );
  }
  return deadline;
}
