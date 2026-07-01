"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ImportarCardapioPage() {
  const [etapa, setEtapa] = useState(1);
const [link, setLink] = useState("");
const [dadosImportados, setDadosImportados] = useState<any | null>(null);
const router = useRouter();

  const etapas = [
    {
      numero: 1,
      titulo: "Informar link",
      descricao: "Cole o link do cardápio",
    },
    {
      numero: 2,
      titulo: "Analisando cardápio",
      descricao: "Extraindo informações",
    },
    {
      numero: 3,
      titulo: "Revisar dados",
      descricao: "Confira os itens encontrados",
    },
    {
      numero: 4,
      titulo: "Importar",
      descricao: "Tudo pronto para usar",
    },
  ];

  const importarCardapio = () => {

  if (!dadosImportados) return;

  localStorage.setItem(
    "importacao-cardapio",
    JSON.stringify(dadosImportados)
  );

router.push("/admin/importar-cardapio/revisar");


};

const analisarCardapio = async () => {
  if (!link.trim()) {
    alert("Informe o link do cardápio.");
    return;
  }

  try {
    const response = await fetch("/api/importar-cardapio", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: link,
      }),
    });

   const data = await response.json();

console.log(data);

if (data.success) {

  setDadosImportados(data.dados);

  setEtapa(2);

} else {
  alert(data.message);
}
  } catch (error) {
    console.error(error);
    alert("Erro ao analisar o cardápio.");
  }
};

  return (
    <div className="space-y-8">

      {/* Cabeçalho */}

      <div className="flex items-center gap-4">

        <Link
          href="/admin"
          className="p-2 rounded-xl hover:bg-zinc-100 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>

        <div>

          <h1 className="text-4xl font-bold tracking-tight text-[#22181C]">
            Importar cardápio
          </h1>

          <p className="text-zinc-500 mt-2">
            Cole o link do cardápio do iFood, 99Food ou outra plataforma para importar tudo automaticamente.
          </p>

        </div>

      </div>

      {/* Barra de etapas */}

      <div className="bg-white rounded-[28px] border border-zinc-200 shadow-sm p-8">

        <div className="grid grid-cols-4 gap-4">

          {etapas.map((item, index) => {

            const ativo = etapa === item.numero;
            const concluido = etapa > item.numero;



            return (

              <div
                key={item.numero}
                className="flex items-center gap-4"
              >

                <div
                  className={`
                    w-12
                    h-12
                    rounded-full
                    flex
                    items-center
                    justify-center
                    font-bold
                    transition-all
                    ${
                      concluido
                        ? "bg-green-100 text-green-600"
                        : ativo
                        ? "bg-[#7A1F3D] text-white"
                        : "bg-zinc-100 text-zinc-500"
                    }
                  `}
                >

                  {concluido ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    item.numero
                  )}

                </div>

                <div className="flex-1">

                  <h3 className="font-semibold text-[#22181C]">
                    {item.titulo}
                  </h3>

                  <p className="text-sm text-zinc-500">
                    {item.descricao}
                  </p>

                </div>

                {index < etapas.length - 1 && (
                  <ChevronRight className="text-zinc-300 w-5 h-5" />
                )}

              </div>

            );

          })}

        </div>

      </div>

      {/* Conteúdo */}

      <div className="bg-white rounded-[30px] border border-zinc-200 shadow-sm p-10 min-h-[550px]">

       {etapa === 1 && (

<div className="max-w-4xl mx-auto">

<div className="text-center">

<div className="w-24 h-24 rounded-full bg-[#FDECEE] flex items-center justify-center mx-auto">

<span className="text-5xl">
🔗
</span>

</div>

<h2 className="text-4xl font-black mt-8 text-[#22181C]">
Importe seu cardápio em poucos segundos
</h2>

<p className="text-zinc-500 mt-4 text-lg leading-8 max-w-2xl mx-auto">
Cole abaixo o link do cardápio público do seu restaurante.
Vamos analisar automaticamente os produtos,
categorias, imagens e adicionais.
</p>

</div>

<div className="mt-12">

<label className="font-bold text-[#22181C] text-lg">
Link do cardápio
</label>

<input
  type="text"
  value={link}
  onChange={(e) => setLink(e.target.value)}
  placeholder="https://www.ifood.com.br/delivery/..."
  className="
    mt-3
    w-full
    h-16
    rounded-2xl
    border
    border-zinc-200
    px-6
    text-lg
    outline-none
    focus:border-[#7A1F3D]
  "
/>

<p className="text-sm text-zinc-500 mt-4">
Suportamos links do iFood, 99Food,
Cardápio Web, Cliente Fiel,
Delivery Much e outras plataformas.
</p>

</div>

<div className="grid md:grid-cols-3 gap-5 mt-12">

<div className="rounded-2xl border border-zinc-200 p-6">

<p className="text-3xl">
📦
</p>

<h3 className="font-bold text-xl mt-4">
Produtos
</h3>

<p className="text-zinc-500 mt-2">
Importamos automaticamente todos os produtos.
</p>

</div>

<div className="rounded-2xl border border-zinc-200 p-6">

<p className="text-3xl">
📂
</p>

<h3 className="font-bold text-xl mt-4">
Categorias
</h3>

<p className="text-zinc-500 mt-2">
Organizamos tudo exatamente como no cardápio.
</p>

</div>

<div className="rounded-2xl border border-zinc-200 p-6">

<p className="text-3xl">
🖼️
</p>

<h3 className="font-bold text-xl mt-4">
Imagens
</h3>

<p className="text-zinc-500 mt-2">
As fotos disponíveis também serão importadas.
</p>

</div>

</div>

<div className="flex justify-end mt-14">

<button
onClick={analisarCardapio}
className="
h-14
px-10
rounded-2xl
bg-gradient-to-r
from-[#7A1F3D]
to-[#5A1B33]
text-white
font-bold
shadow-lg
hover:scale-[1.02]
transition
"
>

Analisar cardápio

</button>

</div>

</div>

)}

{etapa === 2 && (

<div className="max-w-5xl mx-auto">

<div className="text-center">

<div className="w-24 h-24 rounded-full bg-[#FDECEE] flex items-center justify-center mx-auto animate-pulse">

<span className="text-5xl">
🔎
</span>

</div>

<h2 className="text-4xl font-black mt-8">
Analisando o cardápio...
</h2>

<p className="text-zinc-500 mt-4 text-lg">
Estamos identificando todas as informações do seu cardápio.
</p>

</div>

<div className="mt-12">

<div className="h-4 bg-zinc-100 rounded-full overflow-hidden">

<div
className="h-full bg-gradient-to-r from-[#7A1F3D] to-[#B4234A] rounded-full animate-pulse"
style={{ width: "72%" }}
/>

</div>

<p className="text-center text-zinc-500 mt-4">

72% concluído

</p>

</div>

<div className="grid md:grid-cols-2 gap-6 mt-12">

<div className="bg-[#FAFAFA] rounded-3xl border border-zinc-200 p-7">

<div className="flex justify-between">

<h3 className="font-bold text-xl">

Produtos encontrados

</h3>

<span className="text-2xl">

🍔

</span>

</div>

<p className="text-5xl font-black mt-6">

{dadosImportados?.produtos.length ?? 0}

</p>

<p className="text-zinc-500 mt-3">

Produtos identificados automaticamente.

</p>

</div>

<div className="bg-[#FAFAFA] rounded-3xl border border-zinc-200 p-7">

<div className="flex justify-between">

<h3 className="font-bold text-xl">

Categorias

</h3>

<span className="text-2xl">

📂

</span>

</div>

<p className="text-5xl font-black mt-6">

{dadosImportados?.categorias.length ?? 0}

</p>

<p className="text-zinc-500 mt-3">

Categorias encontradas.

</p>

</div>

<div className="bg-[#FAFAFA] rounded-3xl border border-zinc-200 p-7">

<div className="flex justify-between">

<h3 className="font-bold text-xl">

Imagens

</h3>

<span className="text-2xl">

🖼️

</span>

</div>

<p className="text-5xl font-black mt-6">

{dadosImportados?.imagens.length ?? 0}

</p>

<p className="text-zinc-500 mt-3">

Fotos disponíveis para importar.

</p>

</div>

<div className="bg-[#FAFAFA] rounded-3xl border border-zinc-200 p-7">

<div className="flex justify-between">

<h3 className="font-bold text-xl">

Adicionais

</h3>

<span className="text-2xl">

➕

</span>

</div>

<p className="text-5xl font-black mt-6">

{dadosImportados?.adicionais.length ?? 0}

</p>

<p className="text-zinc-500 mt-3">

Complementos encontrados.

</p>

</div>

</div>

<div className="flex justify-between mt-14">

<button
onClick={() => setEtapa(1)}
className="
h-14
px-8
rounded-2xl
border
border-zinc-300
font-bold
hover:border-[#7A1F3D]
transition
"
>

Voltar

</button>

<button
onClick={() => setEtapa(3)}
className="
h-14
px-10
rounded-2xl
bg-gradient-to-r
from-[#7A1F3D]
to-[#5A1B33]
text-white
font-bold
shadow-lg
hover:scale-[1.02]
transition
"
>

Revisar dados encontrados

</button>

</div>

</div>

)}

 {etapa === 3 && (

<div className="space-y-8">

<div className="flex items-center justify-between">

<div>

<h2 className="text-4xl font-black text-[#22181C]">
Revise os dados encontrados
</h2>

<p className="text-zinc-500 mt-2">
Confira os produtos antes de importar para o MeuCardápioApp.
</p>

</div>

<input
placeholder="Pesquisar produto..."
className="
w-72
h-12
rounded-xl
border
border-zinc-200
px-4
outline-none
focus:border-[#7A1F3D]
"
/>

</div>

<div className="grid grid-cols-4 gap-5">

<div className="bg-[#FAFAFA] rounded-2xl border p-5">
<p className="text-zinc-500">Produtos</p>
<p className="text-4xl font-black mt-2">{dadosImportados?.produtos.length ?? 0}</p>
</div>

<div className="bg-[#FAFAFA] rounded-2xl border p-5">
<p className="text-zinc-500">Categorias</p>
<p className="text-4xl font-black mt-2">{dadosImportados?.categorias.length ?? 0}</p>
</div>

<div className="bg-[#FAFAFA] rounded-2xl border p-5">
<p className="text-zinc-500">Imagens</p>
<p className="text-4xl font-black mt-2">{dadosImportados?.imagens.length ?? 0}</p>
</div>

<div className="bg-[#FAFAFA] rounded-2xl border p-5">
<p className="text-zinc-500">Adicionais</p>
<p className="text-4xl font-black mt-2">{dadosImportados?.adicionais.length ?? 0}</p>
</div>

</div>

<div className="rounded-3xl border border-zinc-200 overflow-hidden">

<table className="w-full">

<thead className="bg-zinc-50">

<tr className="text-left">

<th className="p-5">Produto</th>

<th>Categoria</th>

<th>Preço</th>

<th>Status</th>

<th className="text-center">
Ações
</th>

</tr>

</thead>

<tbody>

{dadosImportados?.produtos.map((produto: any, index: number) => (

<tr
  key={index}
  className="border-t hover:bg-zinc-50 transition"
>

<td className="p-5 font-semibold">
  {produto.nome}
</td>

<td>
  {produto.categoria}
</td>

<td>
  {produto.preco}
</td>

<td>
  <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-semibold">
    Pronto
  </span>
</td>

<td>
  <div className="flex justify-center gap-3">
    <button className="text-[#7A1F3D] font-bold">
      Editar
    </button>

    <button className="text-red-500 font-bold">
      Excluir
    </button>
  </div>
</td>

</tr>

))}

</tbody>

</table>

</div>

<div className="flex justify-between">

<button
onClick={() => setEtapa(2)}
className="
h-14
px-8
rounded-2xl
border
border-zinc-300
font-bold
"
>

Voltar

</button>

<button
onClick={importarCardapio}
className="
h-14
px-10
rounded-2xl
bg-gradient-to-r
from-[#7A1F3D]
to-[#5A1B33]
text-white
font-bold
shadow-lg
hover:scale-[1.02]
transition
"
>

Importar Cardápio

</button>

</div>

</div>

)}

{etapa === 4 && (

<div className="max-w-5xl mx-auto">

<div className="text-center">

<div className="
w-28
h-28
rounded-full
bg-green-100
flex
items-center
justify-center
mx-auto
">

<span className="text-6xl">
✅
</span>

</div>

<h2 className="text-5xl font-black mt-8 text-[#22181C]">
Importação concluída!
</h2>

<p className="text-zinc-500 text-lg mt-4 max-w-2xl mx-auto">
Seu cardápio foi preparado e está pronto para ser utilizado no MeuCardápioApp.
Agora você pode editar qualquer informação antes de publicar.
</p>

</div>

<div className="grid md:grid-cols-4 gap-6 mt-14">

<div className="bg-[#FAFAFA] rounded-3xl border border-zinc-200 p-7 text-center">

<p className="text-zinc-500">
Produtos
</p>

<p className="text-5xl font-black mt-4">
{dadosImportados?.produtos.length ?? 0}
</p>

</div>

<div className="bg-[#FAFAFA] rounded-3xl border border-zinc-200 p-7 text-center">

<p className="text-zinc-500">
Categorias
</p>

<p className="text-5xl font-black mt-4">
{dadosImportados?.categorias.length ?? 0}
</p>

</div>

<div className="bg-[#FAFAFA] rounded-3xl border border-zinc-200 p-7 text-center">

<p className="text-zinc-500">
Imagens
</p>

<p className="text-5xl font-black mt-4">
{dadosImportados?.imagens.length ?? 0}
</p>

</div>

<div className="bg-[#FAFAFA] rounded-3xl border border-zinc-200 p-7 text-center">

<p className="text-zinc-500">
Adicionais
</p>

<p className="text-5xl font-black mt-4">
{dadosImportados?.adicionais.length ?? 0}
</p>

</div>

</div>

<div className="
bg-[#FAFAFA]
rounded-3xl
border
border-zinc-200
p-8
mt-10
">

<h3 className="text-2xl font-bold">
Próximos passos
</h3>

<div className="space-y-5 mt-8">

<div className="flex items-center gap-4">

<div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
✔
</div>

<div>

<p className="font-semibold">
Revise os produtos importados
</p>

<p className="text-zinc-500 text-sm">
Altere preços, descrições e categorias se desejar.
</p>

</div>

</div>

<div className="flex items-center gap-4">

<div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
✔
</div>

<div>

<p className="font-semibold">
Personalize seu cardápio
</p>

<p className="text-zinc-500 text-sm">
Troque banner, logo e cores da loja.
</p>

</div>

</div>

<div className="flex items-center gap-4">

<div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
✔
</div>

<div>

<p className="font-semibold">
Publique e comece a vender
</p>

<p className="text-zinc-500 text-sm">
Seu cardápio estará pronto para receber pedidos.
</p>

</div>

</div>

</div>

</div>

<div className="grid md:grid-cols-3 gap-5 mt-12">

<Link
href="/admin/produtos"
className="
h-14
rounded-2xl
border
border-zinc-300
flex
items-center
justify-center
font-bold
hover:border-[#7A1F3D]
transition
"
>

Ir para Produtos

</Link>

<Link
href="/admin"
className="
h-14
rounded-2xl
border
border-zinc-300
flex
items-center
justify-center
font-bold
hover:border-[#7A1F3D]
transition
"
>

Voltar ao Dashboard

</Link>

<Link
href="/"
className="
h-14
rounded-2xl
bg-gradient-to-r
from-[#7A1F3D]
to-[#5A1B33]
text-white
flex
items-center
justify-center
font-bold
shadow-lg
hover:scale-[1.02]
transition
"
>

Visualizar Cardápio

</Link>

</div>

</div>

)}

      </div>

    </div>
  );
}

