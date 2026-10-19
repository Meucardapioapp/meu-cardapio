"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Os motoboys agora ficam na Equipe (área Restaurante), junto com garçons e cozinha. */
export default function MotoboysPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/salao/equipe?funcao=motoboy");
  }, [router]);
  return null;
}
