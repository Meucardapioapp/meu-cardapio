import { chromium } from "playwright";

export async function importarIfood(url: string) {
  console.log("Abrindo navegador...");

  const browser = await chromium.launch({
    headless: true,
  });

  const page = await browser.newPage();
  page.on("request", (request) => {
  const url = request.url();

  if (
    url.includes("site-api") ||
    url.includes("merchant") ||
    url.includes("catalog") ||
    url.includes("menu") ||
    url.includes("graphql")
  ) {
    console.log("=================================");
    console.log(request.method(), url);
  }
});

  console.log("Acessando:");

  console.log(url);

  await page.goto(url, {
    waitUntil: "networkidle",
    timeout: 60000,
  });

 await page.waitForTimeout(15000);

  const html = await page.content();

  console.log("HTML capturado:");
  console.log(html.substring(0, 1000));

  await browser.close();

  return {
    produtos: [],
    categorias: [],
    adicionais: [],
    imagens: [],
  };
}