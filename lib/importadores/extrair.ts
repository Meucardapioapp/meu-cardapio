import { Page } from "playwright";

export async function extrair(page: Page) {
  const cheerio = await import("cheerio");

  // ============================
  // Página principal
  // ============================

  const html = await page.content();
  const $ = cheerio.load(html);

  // ============================
  // Restaurante
  // ============================

  const restaurante = {
    nome: $("h1").first().text().trim(),

    logo:
      $("img")
        .filter((_, el) =>
          ($(el).attr("src") || "").includes("logo")
        )
        .first()
        .attr("src") || "",

    banner:
      $("img")
        .first()
        .attr("src") || "",
  };

  // ============================
  // Arrays
  // ============================

  const categorias: any[] = [];
  const produtos: any[] = [];
  const imagens: string[] = [];
  const adicionais: any[] = [];

  // ============================
  // Categorias
  // ============================

  $("[categoryid]").each((_, categoria) => {
    categorias.push({
      id: $(categoria).attr("categoryid") || "",
      nome: $(categoria).find("h2").first().text().trim(),
    });
  });

  // ============================
  // Produtos
  // ============================

  $("[categoryid]").each((_, categoria) => {
    const categoriaId = $(categoria).attr("categoryid") || "";

    const categoriaNome = $(categoria)
      .find("h2")
      .first()
      .text()
      .trim();

    $(categoria)
      .find("[productid]")
      .each((_, produto) => {
        const texto = $(produto)
          .text()
          .replace(/\s+/g, " ")
          .trim();

        const nome = $(produto)
          .find("h3")
          .first()
          .text()
          .trim();

        const preco =
          texto.match(/R\$\s*\d+,\d{2}/)?.[0] ?? "";

        const descricao = texto
          .replace(nome, "")
          .replace(preco, "")
          .trim();

        const imagem =
          $(produto).find("img").attr("src") ||
          $(produto).find("img").attr("data-src") ||
          "";

        produtos.push({
          id: $(produto).attr("productid") || "",
          categoriaId,
          categoria: categoriaNome,
          nome,
          descricao,
          preco,
          imagem,
          adicionais: [],
        });

        if (imagem) {
          imagens.push(imagem);
        }
      });
  });

  // ==================================================
  // ABRE O PRIMEIRO PRODUTO
  // ==================================================

  console.log("Abrindo primeiro produto...");

  await page.locator("[productid]").first().click();

  await page.waitForTimeout(3000);

  const modalHtml = await page.content();

  const modal = cheerio.load(modalHtml);

  console.log(modalHtml);

  // ==================================================
  // EXTRAI GRUPOS DE ADICIONAIS
  // ==================================================

  modal("[addonid]").each((_, addon) => {
    const grupo = {
      id: modal(addon).attr("addonid") || "",

      titulo: modal(addon)
        .find("li")
        .first()
        .text()
        .replace(/\s+/g, " ")
        .trim(),

      opcoes: [],
    };

    adicionais.push(grupo);
  });

  // ============================
  // Logs
  // ============================

  console.log("Restaurante");
  console.log(restaurante);

  console.log("Categorias:", categorias.length);

  console.log("Produtos:", produtos.length);

  console.log("Imagens:", imagens.length);

  console.log("Grupos de adicionais:");

  console.log(adicionais);

  // ============================

  return {
    restaurante,
    categorias,
    produtos,
    imagens,
    adicionais,
  };
}