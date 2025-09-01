// src/core/automation.ts (Doğru Kütüphane ile)

import { chromium } from "playwright"; // <-- DEĞİŞİKLİK: Artık '@playwright/test' yerine 'playwright' kullanıyoruz.
require("dotenv").config();
import { getLatestUetsCode } from "../services/emailService";
import mockData from "../../mock-data.json";
import { findRowNumberWithAI } from "./ai";
import path from "path";

export async function runAutomation() {
  console.log("Otomasyon motoru başlatıldı...");
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  const tebligatCase = mockData[0];

  try {
    await page.goto("https://ptt.etebligat.gov.tr/login");
    await page
      .getByRole("textbox", { name: "T.C. Kimlik No/UETS Adresi" })
      .fill(process.env.TC_KIMLIK_NO!);
    await page
      .getByRole("textbox", { name: "UETS Şifresi" })
      .fill(process.env.E_DEVLET_SIFRE!);
    await page.getByRole("button", { name: "Giriş" }).click();

    const testStartTime = new Date();
    const verificationCode = await getLatestUetsCode(testStartTime);

    if (!verificationCode) throw new Error("2FA kodu alınamadı.");

    await page.getByRole("textbox").fill(verificationCode);
    await page.getByRole("button", { name: "Devam" }).click();
    console.log("2FA Doğrulama başarılı.");

    await page.getByRole("button", { name: "Oturumu Kapat" }).waitFor();
    console.log("Dashboard başarıyla yüklendi.");

    await page.getByRole("link", { name: "Tebligatlarım" }).click();
    await page.locator("mat-table").waitFor();

    const barcodeMatch = tebligatCase.emailBody.match(/(\d{13,})/);
    const barkodNumarasi = barcodeMatch ? barcodeMatch[0] : null;
    if (!barkodNumarasi) throw new Error("Mock e-postadan barkod alınamadı.");

    const allRows = await page.locator("mat-row").all();
    const allRowTexts: string[] = [];
    for (const row of allRows) {
      const text = await row.textContent();
      if (text) allRowTexts.push(text.trim().replace(/\s+/g, " "));
    }

    console.log(allRowTexts);

    const targetRowNumber = await findRowNumberWithAI(
      allRowTexts,
      barkodNumarasi
    );

    if (targetRowNumber > 0) {
      const hedefSatir = allRows[targetRowNumber - 1];

      // expect komutları testlere özel olduğu için kaldırıldı.
      await hedefSatir.getByText("Görüntüle").click();

      console.log("Detay sayfasındayız. PDF indiriliyor...");
      const downloadPromise = page.waitForEvent("download");
      await page.getByRole("button", { name: "ustyazi.pdf" }).click();
      const download = await downloadPromise;

      const newFilename = `${barkodNumarasi}.pdf`; // Benzersiz isim
      const filePath = path.join(
        __dirname,
        "..",
        "..",
        "downloads",
        newFilename
      );
      await download.saveAs(filePath);
      console.log(`✅ PDF Başarıyla İndirildi: ${filePath}`);

      return filePath;
    } else {
      console.error(`Yapay zeka, tebligatı listede bulamadı.`);
      return null;
    }
  } catch (error) {
    console.error("Otomasyon sırasında bir hata oluştu:", error);
    return null;
  } finally {
    await browser.close();
    console.log("Tarayıcı kapatıldı. Otomasyon motoru görevini tamamladı.");
  }
}
