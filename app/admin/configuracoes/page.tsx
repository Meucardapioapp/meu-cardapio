"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Lightbulb,
  Lock,
  User,
} from "lucide-react";

export default function ConfiguracoesPage() {

const [restauranteId, setRestauranteId] =
  useState("");

const [nome, setNome] =
  useState("");

const [email, setEmail] =
  useState("");

const [whatsapp, setWhatsapp] =
  useState("");

useEffect(() => {
  carregarDados();
}, []);

function formatarTelefone(valor: string) {
  const numero = valor.replace(/\D/g, "");

  return numero
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

async function carregarDados() {
  const id =
    localStorage.getItem("restaurante_id") || "";

  if (!id) return;

  setRestauranteId(id);

  const response = await fetch(
    `/api/configuracoes/${id}`
  );

  const restaurante =
    await response.json();

  setNome(restaurante.nome_responsavel || "");

  setEmail(restaurante.email || "");

setWhatsapp(
  formatarTelefone(restaurante.whatsapp || "")
);
}

async function salvarAlteracoes() {
  await fetch("/api/configuracoes", {
    method: "PUT",

    headers: {
      "Content-Type":
        "application/json",
    },

    body: JSON.stringify({
      restauranteId,
      nome,
    }),
  });

  alert("Dados atualizados.");
}

  return (


    <main className="max-w-5xl space-y-8 pb-10">

      <div>
        <h1 className="text-4xl font-black">
          Configurações
        </h1>

        <p className="mt-2 text-zinc-500">
          Gerencie sua conta e mantenha seus dados sempre atualizados.
        </p>
      </div>

      {/* CONTA */}

      <div className="rounded-3xl border bg-white p-8 shadow-sm">

        <div className="mb-8 flex items-center gap-3">

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F8F1F3]">
            <User className="text-[#6D1F2F]" />
          </div>

          <div>
            <h2 className="text-2xl font-bold">
              Informações da conta
            </h2>

            <p className="text-zinc-500">
              Atualize seus dados de contato.
            </p>
          </div>

        </div>

        <div className="space-y-5">

          <div>
            <label className="mb-2 block font-medium">
              Nome do responsável
            </label>

<Input
  value={nome}
  onChange={(e) =>
    setNome(e.target.value)
  }
  className="h-12 rounded-xl"
/>
</div>


          <div>
            <label className="mb-2 block font-medium">
              E-mail
            </label>

 <Input
  value={email}
  disabled
  className="h-12 rounded-xl bg-zinc-100 cursor-not-allowed"
/>
          </div>

          <div>
            <label className="mb-2 block font-medium">
              WhatsApp
            </label>

<Input
  value={whatsapp}
  disabled
  className="h-12 rounded-xl bg-zinc-100 cursor-not-allowed"
/>

<p className="text-sm text-zinc-500">
  🔒 O e-mail e o WhatsApp são utilizados
  para login e recuperação da conta.
</p>

          </div>

          <div className="flex justify-end">

<Button
  onClick={salvarAlteracoes}
  className="rounded-xl bg-[#6D1F2F] px-8 hover:bg-[#531723]"
>              Salvar alterações
            </Button>

          </div>

        </div>

      </div>

     

      {/* DICA */}

      <div className="rounded-3xl border border-[#F4DDE3] bg-[#FFF8F9] p-6">

        <div className="flex gap-4">

          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F9E9ED]">

            <Lightbulb className="text-[#6D1F2F]" />

          </div>

          <div>

            <h3 className="font-bold text-[#6D1F2F]">
              Dica
            </h3>

            <p className="mt-2 text-zinc-600 leading-7">
              Horários, aparência, endereço do restaurante,
              pagamentos, taxa de entrega e dados bancários
              possuem menus específicos no painel ao lado.
            </p>

          </div>

        </div>

      </div>

    </main>
  );
}