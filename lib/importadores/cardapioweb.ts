import { chromium } from "playwright";
import { extrair } from "./extrair";

export async function importarCardapioWeb(url: string) {
  const browser = await chromium.launch({
    headless: true,
  });

  const page = await browser.newPage();

  await page.goto(url, {
    waitUntil: "networkidle",
    timeout: 60000,
  });

  await page.waitForTimeout(5000);

  const resultado = await extrair(page);

  await browser.close();

  return resultado;
}