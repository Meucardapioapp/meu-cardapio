export function detectarPlataforma(url: string) {
  const link = url.toLowerCase();

  if (link.includes("ifood")) {
    return "ifood";
  }

  if (link.includes("99food")) {
    return "99food";
  }

  if (link.includes("cardapioweb")) {
    return "cardapioweb";
  }

  if (link.includes("anota")) {
    return "anotaai";
  }

  if (link.includes("clientefiel")) {
    return "clientefiel";
  }

  return null;
}