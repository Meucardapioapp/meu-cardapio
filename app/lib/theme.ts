export function getThemeSettings() {

  if (typeof window === "undefined") {

    return {
      lightMode: false,
      selectedColor: "#7F1D1D",
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