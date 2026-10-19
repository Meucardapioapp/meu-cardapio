import { redirect } from "next/navigation";

// Página antiga, substituída por /[restaurante]/pix e /[restaurante]/pedido-aprovado.
// Pode apagar esta pasta.
export default function PaginaAntiga() {
  redirect("/");
}
