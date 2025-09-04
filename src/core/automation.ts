// src/core/automation.ts (Kendi Kendini İyileştiren Versiyon)

import { chromium } from "playwright";
require("dotenv").config();
import { getLatestUetsCode } from "../services/emailService";
import { findRowNumberWithAI } from "./ai";
import path from "path";

export async function runAutomation(barkodNumarasi: string) {
  console.log(`Otomasyon motoru ${barkodNumarasi} barkodu için başlatıldı...`);
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // === BÖLÜM 1: GİRİŞ ===
    await page.goto("https://ptt.etebligat.gov.tr/login");
    await page
      .getByRole("textbox", { name: "T.C. Kimlik No/UETS Adresi" })
      .fill(process.env.TC_KIMLIK_NO!);
    await page
      .getByRole("textbox", { name: "UETS Şifresi" })
      .fill(process.env.E_DEVLET_SIFRE!);
    await page.getByRole("button", { name: "Giriş" }).click();

    // === BÖLÜM 2: AKILLI VE ISRARCI 2FA DOĞRULAMA ===
    let loginSuccess = false;
    for (let i = 0; i < 3; i++) {
      // En fazla 3 kez dene
      console.log(`2FA denemesi ${i + 1}...`);
      const testStartTime = new Date();
      const verificationCode = await getLatestUetsCode(testStartTime);

      if (verificationCode) {
        await page.getByRole("textbox").fill(verificationCode);
        await page.getByRole("button", { name: "Devam" }).click();

        // Başarı ve Başarısızlık locator'larını tanımla
        const successLocator = page.getByRole("button", {
          name: "Oturumu Kapat",
        });
        const failureLocator = page
          .getByRole("alert")
          .filter({ hasText: "Güvenlik kodu doğrulanamadı" });

        // Promise.race ile hangisinin önce geleceğini bekle
        const result = await Promise.race([
          successLocator.waitFor().then(() => "success"),
          failureLocator.waitFor().then(() => "failure"),
        ]);

        if (result === "success") {
          console.log("✅ 2FA Doğrulama başarılı.");
          loginSuccess = true;
          break; // Döngüden çık
        } else {
          console.error(
            "❌ 2FA Kodu hatalı veya geçersiz. Tekrar denenecek..."
          );
        }
      } else {
        console.error("E-postadan 2FA kodu alınamadı. Tekrar denenecek...");
      }
    }

    if (!loginSuccess) {
      throw new Error("2FA adımı 3 deneme sonunda aşılamadı.");
    }

    // === BÖLÜM 3: GÖREVİ YERİNE GETİRME ===
    console.log("Dashboard başarıyla yüklendi.");
    await page.getByRole("link", { name: "Tebligatlarım" }).click();
    await page.locator("mat-table").waitFor();

    // ... (Yapay zeka ile arama, tıklama ve PDF indirme mantığı burada devam ediyor)
    const allRows = await page.locator("mat-row").all();
    const allRowTexts: string[] = [];
    for (const row of allRows) {
      const text = await row.textContent();
      if (text) allRowTexts.push(text.trim().replace(/\s+/g, " "));
    }
    const targetRowNumber = await findRowNumberWithAI(
      allRowTexts,
      barkodNumarasi
    );

    if (targetRowNumber > 0) {
      const hedefSatir = allRows[targetRowNumber - 1];
      await hedefSatir.getByText("Görüntüle").click();

      console.log("Detay sayfasındayız. PDF indiriliyor...");
      const downloadPromise = page.waitForEvent("download");
      await page.getByRole("button", { name: /\.pdf/i }).first().click();
      const download = await downloadPromise;

      const newFilename = `${barkodNumarasi}.pdf`;
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
      console.error(
        `Yapay zeka, "${barkodNumarasi}" içeren tebligatı bulamadı.`
      );
      return null;
    }
  } catch (error) {
    console.error("Otomasyon sırasında bir hata oluştu:", error);
    return null;
  } finally {
    await browser.close();
    console.log("Tarayıcı kapatıldı.");
  }
}
