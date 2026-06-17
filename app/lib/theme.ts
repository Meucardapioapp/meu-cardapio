export function getThemeSettings() {

  if (typeof window === "undefined") {

    return {
  lightMode: true,
  selectedColor: "#6D1F2F",
}
  }

  const lightMode =
    localStorage.getItem(
      "cardapio-light-mode"
    ) === "true"

  const selectedColor =
    localStorage.getItem(
      "cardapio-primary-color"
    ) || "#7F1D1D"

  return {
    lightMode,
    selectedColor,
  }
}