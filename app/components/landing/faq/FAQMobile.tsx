"use client";

import { useState } from "react";
import { ChevronDown, MessageCircle } from "lucide-react";
import Link from "next/link";

const perguntas = [
  {
    pergunta: "Tem mensalidade?",
    resposta:
      "Não. Você pode criar seu cardápio gratuitamente e começar a vender em poucos minutos.",
  },
  {
    pergunta: "Posso receber Pix e cartão de crédito?",
    resposta:
      "Sim. Você pode receber Pix de forma online, cartão de débito/credito e dinheiro na entrega",
  },
  {
    pergunta: "Como recebo os pedidos?",
    resposta:
      "Todos os pedidos chegam diretamente no painel do MeuCardapioApp em tempo real.",
  },
  {
    pergunta: "Em quanto tempo recebo os valores que recebi online?",
    resposta:
      "O valor fica disponivel no seu painel e em até 1 dia util após você sacar, cai na sua conta",
  },
  {
    pergunta: "Quanto tempo leva para criar meu cardápio?",
    resposta:
      "Em menos de 5 minutos você consegue cadastrar seu restaurante e começar a vender.",
  },
  {
    pergunta: "Posso divulgar no WhatsApp?",
    resposta:
      "Sim. Você recebe um link exclusivo para compartilhar no WhatsApp, Instagram, Facebook e onde quiser.",
  },
  {
    pergunta: "Funciona para qualquer restaurante?",
    resposta:
      "Sim. Hamburguerias, pizzarias, açaiterias, marmitarias, sushi, cafeterias, docerias e muito mais.",
  },
  {
    pergunta: "Posso personalizar meu cardápio?",
    resposta:
      "Sim. Você pode alterar cores, categorias, produtos, horários, taxas de entrega e muito mais.",
  },
];

export default function FAQMobile() {
  const [aberto, setAberto] = useState<number | null>(0);

  return (
    <section className="bg-[#F8F6F4] px-5 py-14">

      <h2 className="text-center text-3xl font-black leading-tight">
        Ainda tem{" "}
        <span className="text-[#6D1F2F]">
          dúvidas?
        </span>
      </h2>

      <p className="mt-3 text-center text-zinc-500">
        Respondemos as perguntas mais comuns.
      </p>

      <div className="mt-8 space-y-4">

        {perguntas.map((item, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-3xl border border-zinc-200 bg-white"
          >
            <button
              onClick={() =>
                setAberto(aberto === index ? null : index)
              }
              className="flex w-full items-center justify-between p-5 text-left"
            >
              <span className="font-bold text-[#111]">
                {item.pergunta}
              </span>

              <ChevronDown
                size={20}
                className={`transition-transform ${
                  aberto === index ? "rotate-180" : ""
                }`}
              />
            </button>

            {aberto === index && (
              <div className="border-t border-zinc-100 px-5 py-4">
                <p className="leading-7 text-zinc-600">
                  {item.resposta}
                </p>
              </div>
            )}
          </div>
        ))}

      </div>

      

    </section>
  );
}