import { redirect } from "next/navigation";

// "Primeiros passos" virou o guia que pisca no menu do painel.
export default function PrimeirosPassosPage() {
  redirect("/admin");
}
