"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

type Extra = {
  id?: string;
  nome: string;
  preco: string;
};

type Categoria = {
  id: string;
  nome: string;
};

function formatarPreco(valor: string) {
  let numero = valor
    .replace(/[^\d.,]/g, "")
    .replace(".", ",");

  if (!numero) return "";

  const partes = numero.split(",");

  let inteiro = partes[0];

  inteiro = inteiro.replace(/^0+(?!$)/, "");

  inteiro = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  let decimal = partes[1] || "";

  decimal = decimal.substring(0, 2);

if (numero.includes(",")) {
  return `${inteiro},${decimal.padEnd(2, "0")}`;
}

return `${inteiro},00`;
}

function precoNumero(valor: string) {
  return Number(
    valor
      .replace("R$", "")
      .replace(/\./g, "")
      .replace(",", ".")
      .trim()
  );
}

export default function NovoProdutoPage() {

  const searchParams = useSearchParams();

  const produtoId = searchParams.get("id");

  /* ===========================
      ESTADOS
  =========================== */

  const [loading, setLoading] = useState(false);

  const [nome, setNome] = useState("");

  const [descricao, setDescricao] = useState("");

  const [preco, setPreco] = useState("");

  const [precoAntigo, setPrecoAntigo] = useState("");

  const [promocao, setPromocao] =
    useState(false);

  const [categoria, setCategoria] =
    useState("");

  const [categorias, setCategorias] =
    useState<Categoria[]>([]);

  const [imagem, setImagem] =
    useState<File | null>(null);

  const [previewImagem, setPreviewImagem] =
    useState("");

  const [extras, setExtras] =
    useState<Extra[]>([]);

  const [extraNome, setExtraNome] =
    useState("");

  const [extraPreco, setExtraPreco] =
    useState("");


  /* ===========================
      ITENS OBRIGATÓRIOS
  =========================== */

 type OpcaoObrigatoria = {
  id: string;
  nome: string;
  preco: string;
  imagem: string;
};

type GrupoObrigatorio = {
  id: string;
  nome: string;
  minimo: number;
  maximo: number;

  inputNome: string;
  inputPreco: string;

  opcoes: OpcaoObrigatoria[];
};

const [gruposObrigatorios, setGruposObrigatorios] =
  useState<GrupoObrigatorio[]>([
 {
  id: crypto.randomUUID(),
  nome: "",
  minimo: 1,
  maximo: 2,

  inputNome: "",
  inputPreco: "",

  opcoes: [
        {
          id: crypto.randomUUID(),
          nome: "",
          preco: "",
          imagem: "",
        },
      ],
    },
  ]);

  /* ===========================
      LOAD
  =========================== */

useEffect(() => {

    buscarCategorias();

    if (produtoId) {

        carregarProduto();

    }

}, [produtoId]);

  /* ===========================
      CATEGORIAS
  =========================== */

  async function buscarCategorias() {

    const restauranteId =
      localStorage.getItem("restaurante_id");

    if (!restauranteId) return;

    const { data, error } =
      await supabase
        .from("categorias")
        .select("*")
        .eq("restaurante_id", restauranteId)
        .order("nome");

    if (error) {

      console.log(error);

      return;

    }

    setCategorias(data || []);
  }


  async function carregarProduto() {

  const { data, error } = await supabase
    .from("produtos")
    .select("*")
    .eq("id", produtoId)
    .single()

  if (error || !data) return

  setNome(data.nome || "")
  setDescricao(data.descricao || "")
  setPreco(formatarPreco(String(data.preco)))
  setPrecoAntigo(
    data.preco_antigo
      ? formatarPreco(String(data.preco_antigo))
      : ""
  )

  setCategoria(data.categoria || "")
  setPromocao(data.promocao || false)
  setPreviewImagem(data.imagem || "")

// CARREGA OS GRUPOS OBRIGATÓRIOS

const { data: grupos } = await supabase
  .from("grupos_obrigatorios")
  .select("*")
  .eq("produto_id", produtoId)
  .order("ordem")

if (grupos && grupos.length > 0) {

  const gruposFormatados = await Promise.all(

    grupos.map(async (grupo: any) => {

      const { data: opcoes } = await supabase
        .from("grupo_obrigatorio_opcoes")
        .select("*")
        .eq("grupo_id", grupo.id)
        .order("ordem")

return {

  id: grupo.id,

  nome: grupo.nome,

  minimo: grupo.minimo,

  maximo: grupo.maximo,

  inputNome: "",

  inputPreco: "",

  opcoes:

          (opcoes || []).map((o: any) => ({

            id: o.id,

            nome: o.nome,

            preco: formatarPreco(String(o.preco)),

            imagem: o.imagem || "",

          })),

      }

    })

  )

  setGruposObrigatorios(gruposFormatados)

}

const { data: adicionais } = await supabase
  .from("adicionais")
  .select("*")
  .eq("produto_id", produtoId)
  .order("nome")

if (adicionais) {

  setExtras(

    adicionais.map((item: any) => ({

      id: item.id,

      nome: item.nome,

      preco: formatarPreco(String(item.preco))

    }))

  )

}


}

  /* ===========================
      UPLOAD IMAGEM
  =========================== */

  async function uploadImagem(file: File) {

    const fileName =
      `${Date.now()}-${file.name}`;

    const { error } =
      await supabase.storage
        .from("products")
        .upload(fileName, file);

    if (error) {

      toast.error("Erro ao enviar imagem");

      return null;

    }

    const { data } =
      supabase.storage
        .from("products")
        .getPublicUrl(fileName);

    return data.publicUrl;
  }

  /* ===========================
      ADICIONAIS
  =========================== */

  function adicionarExtra() {

    if (!extraNome || !extraPreco)
      return;

    setExtras((atual) => [

      ...atual,

      {

        nome: extraNome,

preco: formatarPreco(extraPreco),

      },

    ]);

    setExtraNome("");

    setExtraPreco("");

  }

  function adicionarGrupoObrigatorio() {

  setGruposObrigatorios((atual)=>[

    ...atual,

{
  id: crypto.randomUUID(),
  nome: "",
  minimo: 1,
  maximo: 2,

  inputNome: "",
  inputPreco: "",

  opcoes:[
        {
          id: crypto.randomUUID(),
          nome:"",
          preco:"",
          imagem:"",
        }
      ]

    }

  ])

}

function removerGrupo(id:string){

setGruposObrigatorios((atual)=>

atual.filter(
grupo=>grupo.id!==id
)

)

}

function adicionarOpcao(grupoId: string) {

  setGruposObrigatorios((atual) =>

    atual.map((grupo) => {

      if (grupo.id !== grupoId) return grupo;

      if (!grupo.inputNome || !grupo.inputPreco)
        return grupo;

      return {

        ...grupo,

        inputNome: "",

        inputPreco: "",

        opcoes: [

          ...grupo.opcoes,

          {

            id: crypto.randomUUID(),

            nome: grupo.inputNome,

            preco: formatarPreco(grupo.inputPreco),

            imagem: "",

          },

        ],

      };

    })

  );

}

function alterarNomeGrupo(

grupoId:string,

nome:string

){

setGruposObrigatorios((atual)=>

atual.map((grupo)=>{

if(grupo.id!==grupoId)
return grupo

return{

...grupo,

nome

}

})

)

}

function alterarMaximo(

grupoId:string,

maximo:number

){

setGruposObrigatorios((atual)=>

atual.map((grupo)=>{

if(grupo.id!==grupoId)
return grupo

return{

...grupo,

maximo

}

})

)

}

function alterarInputNomeGrupo(
  grupoId: string,
  valor: string
) {

  setGruposObrigatorios((atual)=>

    atual.map((grupo)=>

      grupo.id===grupoId
        ? { ...grupo, inputNome: valor }
        : grupo

    )

  );

}

function alterarInputPrecoGrupo(
  grupoId: string,
  valor: string
) {

  setGruposObrigatorios((atual)=>

    atual.map((grupo)=>

      grupo.id===grupoId
        ? { ...grupo, inputPreco: valor }
        : grupo

    )

  );

}


function alterarOpcao(

grupoId:string,

opcaoId:string,

campo:"nome"|"preco"|"imagem",

valor:any

){

setGruposObrigatorios((atual)=>

atual.map((grupo)=>{

if(grupo.id!==grupoId)
return grupo

return{

...grupo,

opcoes:

grupo.opcoes.map((opcao)=>{

if(opcao.id!==opcaoId)
return opcao

return{

...opcao,

[campo]:valor

}

})

}

})

)

}

function validarFormulario() {

  if (!nome.trim()) {
  console.log("ERRO 1");
toast.error("Informe o nome");
return false;
  }

  if (!categoria) {
 console.log("ERRO 2");
toast.error("Escolha uma categoria");
return false;
  }

  if (!preco.trim()) {
console.log("ERRO 3");
toast.error("Informe o preço");
return false;
  }

 for (let i = 0; i < gruposObrigatorios.length; i++) {

  const grupo = gruposObrigatorios[i];

  // Ignora grupo vazio
  if (
    !grupo.nome.trim() &&
    grupo.opcoes.every(
      (o) => !o.nome.trim() && !o.preco.trim()
    )
  ) {
    continue;
  }

  if (!grupo.nome.trim()) {
    toast.error(
      `O Item Obrigatório ${i + 1} está sem nome.`
    );
    return false;
  }

    if (grupo.opcoes.length === 0) {
      toast.error(
        `O Item Obrigatório ${i + 1} precisa ter pelo menos uma opção.`
      );
      return false;
    }

    for (let j = 0; j < grupo.opcoes.length; j++) {

      const opcao = grupo.opcoes[j];

      if (!opcao.nome.trim()) {
        toast.error(
          `A opção ${j + 1} do Item Obrigatório ${i + 1} está sem nome.`
        );
        return false;
      }

      if (!opcao.preco.trim()) {
        toast.error(
          `Informe o preço da opção "${opcao.nome || j + 1}".`
        );
        return false;
      }

    }

  }

  return true;

}


async function editarProduto() {

  console.log("EDITAR INICIO")

  const imagemUrl = imagem
    ? await uploadImagem(imagem)
    : previewImagem

  console.log("IMAGEM OK")

  const { data, error } = await supabase
    .from("produtos")
    .update({
      nome,
      descricao,
      categoria,
      preco: precoNumero(preco),
      preco_antigo: precoAntigo
        ? precoNumero(precoAntigo)
        : null,
      promocao,
      imagem: imagemUrl,
    })
    .eq("id", produtoId)
    .select()

  console.log("DATA:", data)
  console.log("ERROR:", error)

  if (error) {
    console.log(error)
    toast.error("Erro ao editar produto")
    return
  }

 console.log("EDITOU")

await supabase
  .from("grupos_obrigatorios")
  .delete()
  .eq("produto_id", produtoId)

for (const grupo of gruposObrigatorios) {

  if (!grupo.nome.trim()) continue

  const respostaGrupo = await supabase
    .from("grupos_obrigatorios")
    .insert({
      produto_id: produtoId,
      nome: grupo.nome,
      minimo: grupo.minimo,
      maximo: grupo.maximo,
      ordem: 0,
    })
    .select()

  const grupoCriado = respostaGrupo.data?.[0]

  if (!grupoCriado) continue

  const opcoes = grupo.opcoes
    .filter((o) => o.nome.trim() !== "")
    .map((o) => ({
      grupo_id: grupoCriado.id,
      nome: o.nome,
      preco: precoNumero(o.preco),
      imagem: o.imagem || "",
      ordem: 0,
    }))

  if (opcoes.length > 0) {

    await supabase
      .from("grupo_obrigatorio_opcoes")
      .insert(opcoes)

  }

}

await supabase
  .from("adicionais")
  .delete()
  .eq("produto_id", produtoId)

if (extras.length > 0) {

  await supabase
    .from("adicionais")
    .insert(

      extras.map(extra => ({

        produto_id: produtoId,

        nome: extra.nome,

        preco: precoNumero(extra.preco)

      }))

    )

}

toast.success("Produto atualizado!")

window.location.href = "/admin/produtos"

}

  /* ===========================
      CRIAR PRODUTO
  =========================== */

  async function criarProduto() {

  console.log("CLICOU NO BOTÃO");

    try {

      setLoading(true);

if (produtoId) {

  await editarProduto()

  return

}

const valido = validarFormulario();

console.log("VALIDOU:", valido);

if (!valido) return;

      const restauranteId =
        localStorage.getItem("restaurante_id");

      if (!restauranteId) {

        toast.error("Restaurante não encontrado");

        return;

      }

      if (!categoria) {

        toast.error("Selecione uma categoria");

        return;

      }

      let imagemUrl = "";

      if (imagem) {

        const upload =
          await uploadImagem(imagem);

        if (!upload)
          return;

        imagemUrl = upload;

      }

      const { data, error } =
        await supabase
          .from("produtos")
          .insert({

            restaurante_id:
              restauranteId,

            nome,

            descricao,

            categoria,

preco: precoNumero(preco),

preco_antigo:
precoAntigo
? precoNumero(precoAntigo)
: null,

            promocao,

            imagem: imagemUrl,

            destaque: "normal",

          })
          .select()
          .single();

          console.log("DATA:", data);
console.log("ERROR:", error);

      if (error) {

        console.log(error);

        toast.error("Erro ao criar produto");

        return;

      }

      if (extras.length > 0) {

        await supabase
          .from("adicionais")
          .insert(

            extras.map((extra) => ({

              produto_id: data.id,

              nome: extra.nome,

              preco: precoNumero(extra.preco),

            }))

          );

          console.log("ADICIONAIS:", extras);
console.log("ERRO ADICIONAIS:", error);


        }

console.log("GRUPOS:", gruposObrigatorios);

for (const grupo of gruposObrigatorios) {

  console.log("SALVANDO GRUPO:", grupo);

  if (!grupo.nome.trim()) continue;

const respostaGrupo = await supabase
  .from("grupos_obrigatorios")
  .insert({
    produto_id: data.id,
    nome: grupo.nome,
    minimo: grupo.minimo,
    maximo: grupo.maximo,
    ordem: 0,
  })
  .select();

console.log("RESPOSTA COMPLETA:", respostaGrupo);

const grupoCriado = respostaGrupo.data?.[0];
const erroGrupo = respostaGrupo.error;

console.log("GRUPO CRIADO:", grupoCriado);
console.log("ERRO GRUPO:", erroGrupo);

  if (erroGrupo) {

    console.log(erroGrupo);

    toast.error("Erro ao salvar item obrigatório");

    continue;

  }

  if (grupo.opcoes.length > 0) {

    const opcoes = grupo.opcoes
      .filter((o) => o.nome.trim() !== "")
      .map((o) => ({

        grupo_id: grupoCriado.id,

        nome: o.nome,

        preco: precoNumero(o.preco),

        imagem: o.imagem || "",

        ordem: 0,

      }));

    if (opcoes.length > 0) {

      const { error } = await supabase
        .from("grupo_obrigatorio_opcoes")
        .insert(opcoes);

        console.log("OPÇÕES:", opcoes);
console.log("ERRO OPÇÕES:", error);

      if (error) {

        console.log(error);

        toast.error("Erro ao salvar opções");

      }

    }

  }

}


      toast.success("Produto criado!");

      setNome("");
setDescricao("");
setPreco("");
setPrecoAntigo("");
setCategoria("");
setPromocao(false);
setImagem(null);
setPreviewImagem("");
setExtras([]);

setGruposObrigatorios([
  {
    id: crypto.randomUUID(),
    nome: "",
    minimo: 1,
    maximo: 2,

    inputNome: "",
    inputPreco: "",

    opcoes: [
      {
        id: crypto.randomUUID(),
        nome: "",
        preco: "",
        imagem: "",
      },
    ],
  },
]);

    } catch (err) {

      console.log(err);

      toast.error("Erro inesperado");

    } finally {

      setLoading(false);

    }

  }
  

 return (
  <main className="min-h-screen bg-[#F8F6F4] py-10 px-8">

    <div className="max-w-[1700px] mx-auto">

      {/* HEADER */}

      <div className="flex items-center justify-between mb-10">

        <div>

<Link
  href="/admin/produtos"
  className="
    inline-flex
    items-center
    gap-2
    h-11
    px-5
    rounded-2xl
    border
    border-zinc-200
    bg-white
    text-zinc-600
    font-semibold
    shadow-sm
    hover:border-[#7A1F3D]
    hover:text-[#7A1F3D]
    hover:shadow-md
    transition-all
    duration-200
"
>
  <ArrowLeft size={18} />
  Voltar para produtos
</Link>

          
        </div>

      </div>

      {/* ====================== */}
      {/* INFORMAÇÕES BÁSICAS */}
      {/* ====================== */}

      <section
        className="
        bg-white
        rounded-[28px]
        border
        border-zinc-200
        p-10
        shadow-md
        mb-8
        "
      >

        <h2
          className="
          text-2xl
          font-black
          text-[#1F1720]
          mb-8
          "
        >
          Informações Básicas
        </h2>

        <div className="space-y-6">

            <label className="font-semibold text-zinc-700 mb-3 block">
              Nome do produto
            </label>

            <input
              value={nome}
              onChange={(e) =>
                setNome(e.target.value)
              }
              placeholder="Ex.: X-Burger Especial"
              className="
              w-full
              h-16
              rounded-2xl
              border
              border-zinc-200
              px-5
              outline-none
              focus:border-[#7A1F3D]
              "
            />

          </div>

<div className="grid grid-cols-2 gap-6 mt-6">

          <div>

            <label className="font-semibold text-zinc-700 mb-3 block">
              Preço
            </label>

<div className="relative">

  <span
    className="
      absolute
      left-5
      top-1/2
      -translate-y-1/2
      text-zinc-500
      font-semibold
      pointer-events-none
    "
  >
    R$
  </span>

  <input
    value={preco}
    onChange={(e) => setPreco(e.target.value)}
    onBlur={() => setPreco(formatarPreco(preco))}
    placeholder="19,90"
    className="
      w-full
      h-16
      rounded-2xl
      border
      border-zinc-200
      pl-14
      pr-5
      outline-none
      focus:border-[#7A1F3D]
    "
  />

</div>

          </div>

          <div>

            <label className="font-semibold text-zinc-700 mb-3 block">
              Preço antigo
            </label>

<div className="relative">

  <span
    className="
      absolute
      left-5
      top-1/2
      -translate-y-1/2
      text-zinc-500
      font-semibold
      pointer-events-none
    "
  >
    R$
  </span>

  <input
    value={precoAntigo}
    onChange={(e) => setPrecoAntigo(e.target.value)}
    onBlur={() => setPrecoAntigo(formatarPreco(precoAntigo))}
    placeholder="29,90"
    className="
      w-full
      h-16
      rounded-2xl
      border
      border-zinc-200
      pl-14
      pr-5
      outline-none
      focus:border-[#7A1F3D]
    "
  />

</div>

        </div>

        </div>

        <div className="grid grid-cols-2 gap-6 mt-8">

          <div>

            <label className="font-semibold text-zinc-700 mb-3 block">
              Categoria
            </label>

            <select
              value={categoria}
              onChange={(e)=>
                setCategoria(e.target.value)
              }
              className="
              w-full
              h-16
              rounded-2xl
              border
              border-zinc-200
              px-5
              "
            >

              <option value="">
                Escolha uma categoria
              </option>

              {categorias.map((item)=>(
                <option
                  key={item.id}
                  value={item.nome}
                >
                  {item.nome}
                </option>
              ))}

            </select>

          </div>

          <div className="flex items-end pt-8">

<label
className="
flex
items-center
gap-4
h-16
px-5
rounded-2xl
border
border-zinc-200
cursor-pointer
hover:border-[#7A1F3D]
transition
select-none
"
>

<input
type="checkbox"
checked={promocao}
onChange={(e)=>setPromocao(e.target.checked)}
className="
w-6
h-6
accent-[#7A1F3D]
cursor-pointer
"
/>

              Produto em promoção

            </label>

          </div>

        </div>

        <div className="mt-6">

          <label className="font-semibold text-zinc-700 mb-2 block">
            Descrição
          </label>

          <textarea
            value={descricao}
            onChange={(e)=>
              setDescricao(e.target.value)
            }
            placeholder="Descreva o produto..."
            className="
            w-full
            h-40
            rounded-2xl
            border
            border-zinc-200
            p-5
            resize-none
            outline-none
            "
          />

        </div>

      </section>

      {/* ====================== */}
      {/* IMAGEM */}
      {/* ====================== */}

      <section
        className="
        bg-white
        rounded-[28px]
        border
        border-zinc-200
        p-10
        shadow-md
        mb-8
        "
      >

        <h2
          className="
          text-2xl
          font-black
          mb-8
          "
        >
          Imagem do Produto
        </h2>

        <label
          htmlFor="imagem"
          className="
          w-full
          h-[240px]
          rounded-[28px]
          border-2
          border-dashed
          border-zinc-300
          flex
          flex-col
          justify-center
          items-center
          cursor-pointer
          hover:border-[#7A1F3D]
          transition
          overflow-hidden
          "
        >

          {imagem || previewImagem ? (

            <img
              src={
                imagem
                  ? URL.createObjectURL(imagem)
                  : previewImagem
              }
              className="
              w-full
              h-full
              object-cover
              "
            />

          ) : (

            <>

              <div className="text-5xl">
                📷
              </div>

              <p className="font-bold text-lg mt-3">
                Clique para enviar uma imagem
              </p>

              <span className="text-zinc-500 mt-2">
                JPG, PNG ou WEBP
              </span>

            </>

          )}

        </label>

        <input
          id="imagem"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e)=>{

            const file=e.target.files?.[0];

            if(!file) return;

            setImagem(file);

            setPreviewImagem(
              URL.createObjectURL(file)
            );

          }}
        />

      </section>

      {/* ==========================
    ITENS OBRIGATÓRIOS
========================== */}

<section
  className="
  bg-white
  rounded-[28px]
  border
  border-zinc-200
  p-10
  shadow-md
  mb-8
  "
>

  <div className="flex items-center justify-between">

    <div>

      <h2 className="text-2xl font-black">
        Itens Obrigatórios
      </h2>

      <p className="text-zinc-500 mt-2">
        O cliente será obrigado a selecionar estes itens.
      </p>

    </div>

    <button
      onClick={adicionarGrupoObrigatorio}
      className="
      bg-[#7A1F3D]
      text-white
      rounded-2xl
      px-6
      h-12
      font-bold
      hover:scale-105
      transition
      "
    >
      + Novo Item Obrigatório
    </button>

  </div>

  <div className="space-y-8 mt-8">

    {gruposObrigatorios.map((grupo,index)=>(

      <div
        key={grupo.id}
        className="
        rounded-[28px]
        border
        border-zinc-200
        p-6
        "
      >

        <div className="flex justify-between">

          <h3 className="text-lg font-bold">

            Item Obrigatório {index+1}

          </h3>

          <button
            onClick={()=>
              removerGrupo(grupo.id)
            }
            className="
            text-red-500
            font-semibold
            "
          >
            Excluir
          </button>

        </div>

        <div className="grid grid-cols-2 gap-6 mt-6">

          <div>

            <label className="font-semibold mb-2 block">

              Nome do Item

            </label>

            <input

              value={grupo.nome}

              onChange={(e)=>

                alterarNomeGrupo(

                  grupo.id,

                  e.target.value

                )

              }

              placeholder="Ex.: Escolha o pão"

              className="
              w-full
              h-16
              border
              rounded-2xl
              px-5
              "

            />

          </div>

          <div>

            <label className="font-semibold mb-2 block">

              Máximo de opções

            </label>

            <select

              value={grupo.maximo}

              onChange={(e)=>

                alterarMaximo(

                  grupo.id,

                  Number(e.target.value)

                )

              }

              className="
              w-full
              h-16
              border
              rounded-2xl
              px-5
              "

            >  
              <option value={1}>
                Até 1 opção
              </option>

              <option value={2}>
                Até 2 opções
              </option>

              <option value={3}>
                Até 3 opções
              </option>

              <option value={4}>
                Até 4 opções
              </option>

<option value={999}>ilimitado</option>


            </select>

          </div>

        </div>

 <div
  className="
  grid
  grid-cols-[1fr_220px_180px]
  gap-5
  mt-8
  "
>

  <input
   value={grupo.inputNome}
    onChange={(e)=>
  alterarInputNomeGrupo(grupo.id, e.target.value)
}
    placeholder="Nome"
    className="
    h-16
    border
    rounded-2xl
    px-5
    "
  />

  <div className="relative">

    <span
      className="
      absolute
      left-5
      top-1/2
      -translate-y-1/2
      text-zinc-500
      font-semibold
      "
    >
      R$
    </span>

    <input
      value={grupo.inputPreco}
      onChange={(e)=>
  alterarInputPrecoGrupo(grupo.id, e.target.value)
}
onBlur={()=>

  alterarInputPrecoGrupo(

    grupo.id,

    formatarPreco(grupo.inputPreco)

  )

}
      placeholder="0,00"
      className="
      w-full
      h-16
      border
      rounded-2xl
      pl-14
      pr-5
      "
    />

  </div>

  <button
    onClick={()=>adicionarOpcao(grupo.id)}
    className="
    bg-[#7A1F3D]
    text-white
    rounded-2xl
    font-bold
    "
  >
    Adicionar
  </button>

</div>

<div className="space-y-3 mt-7">

  {grupo.opcoes.map((opcao)=>(

    <div
      key={opcao.id}
      className="
      flex
      justify-between
      items-center
      rounded-2xl
      border
      p-4
      "
    >

      <div>

        <p className="font-bold">
          {opcao.nome}
        </p>

        <p className="text-zinc-500">
          R$ {opcao.preco}
        </p>

      </div>

      <button

        className="
        text-red-500
        font-semibold
        "
      >
        Excluir
      </button>

    </div>

  ))}

</div>

      </div>

    ))}

  </div>

</section>

{/* ==========================
      ADICIONAIS
========================== */}

<section
className="
bg-white
rounded-[28px]
border
border-zinc-200
p-10
shadow-md
mb-10
"
>

<h2
className="
text-2xl
font-black
mb-8
"
>

Itens Adicionais

</h2>

<div
className="
grid
grid-cols-[1fr_220px_180px]
gap-5
"
>

<input
value={extraNome}

onChange={(e)=>setExtraNome(e.target.value)}

placeholder="Nome"

className="
h-16
border
rounded-2xl
px-5
"
/>

<div className="relative">

  <span
    className="
      absolute
      left-5
      top-1/2
      -translate-y-1/2
      text-zinc-500
      font-semibold
      pointer-events-none
    "
  >
    R$
  </span>

  <input
    value={extraPreco}
    onChange={(e) => setExtraPreco(e.target.value)}
    onBlur={() => setExtraPreco(formatarPreco(extraPreco))}
    placeholder="0,00"
    className="
      w-full
      h-[72px]
      border
      rounded-2xl
      pl-14
      pr-5
    "
  />

</div>

<button

onClick={adicionarExtra}

className="
bg-[#7A1F3D]
text-white
rounded-2xl
font-bold
"

>

Adicionar

</button>

</div>

<div
className="
space-y-3
mt-7
"
>

{extras.map((extra,index)=>(

<div

key={index}

className="
flex
justify-between
items-center
rounded-2xl
border
p-4
"

>

<div>

<p className="font-bold">

{extra.nome}

</p>

<p className="text-zinc-500">
  R$ {extra.preco}
</p>

</div>

<button

onClick={()=>

setExtras(

extras.filter(

(_,i)=>i!==index

)

)

}

className="
text-red-500
font-semibold
"

>

Excluir

</button>

</div>

))}

</div>

</section>

    </div>

    {/* FOOTER */}

<div className="sticky bottom-0 mt-10 bg-[#F8F6F4] py-6">

  <div className="flex justify-end gap-4">

    <Link
      href="/admin/produtos"
      className="
      h-14
      px-8
      rounded-2xl
      border
      flex
      items-center
      justify-center
      font-semibold
      "
    >
      Cancelar
    </Link>

    <button
      onClick={criarProduto}
      disabled={loading}
      className="
      h-14
      px-10
      rounded-2xl
      bg-[#7A1F3D]
      text-white
      font-bold
      hover:scale-[1.02]
      active:scale-95
      transition
      disabled:opacity-60
      "
    >
      {loading
        ? "Salvando..."
        : "Salvar Produto"}
    </button>

  </div>

</div>

  </main>
);
}