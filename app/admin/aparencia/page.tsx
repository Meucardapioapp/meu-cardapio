"use client"

import {
  useEffect,
  useRef,
  useState,
} from "react"

import Link from "next/link"

import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"

const colors = [
  "#556B2F",
  "#7F1D1D",
  "#D4AF37",
  "#1E3A8A",
  "#6B21A8",
  "#18181B",
]

const bgPage = "bg-[#F4F1EA]"

const cardBg = "bg-white"

const borderColor = "border-[#DDD6CC]"

const textPrimary = "text-zinc-900"

const textSecondary = "text-zinc-600"

export default function AparenciaPage() {

  const [selectedColor, setSelectedColor] =
    useState("#556B2F")

    const [categoriaRestaurante, setCategoriaRestaurante] =
  useState("")

  const [nomeRestaurante,
  setNomeRestaurante] =
  useState("")

const [pedidoMinimo,
  setPedidoMinimo] =
  useState("")

const [tipoAtendimento, setTipoAtendimento] =
  useState("Delivery")


  const [logoPreview, setLogoPreview] =
    useState<string | null>(null)

  const [bannerPreview, setBannerPreview] =
  useState<string | null>(null)

const [horarios, setHorarios] =
  useState({
    seg_inicio: "",
    seg_fim: "",
    ter_inicio: "",
    ter_fim: "",
    qua_inicio: "",
    qua_fim: "",
    qui_inicio: "",
    qui_fim: "",
    sex_inicio: "",
    sex_fim: "",
    sab_inicio: "",
    sab_fim: "",
    dom_inicio: "",
    dom_fim: "",
  })

const [savedMessage, setSavedMessage] =
  useState(false)

  const [loading, setLoading] =
  useState(true)

const [restauranteId, setRestauranteId] =
  useState<string | null>(null)

const [premium, setPremium] =
  useState(false)

const [statusAssinatura, setStatusAssinatura] =
  useState("")

  const [slug, setSlug] =
  useState("")

  const logoInputRef =
    useRef<HTMLInputElement>(null)

  const bannerInputRef =
    useRef<HTMLInputElement>(null)

  useEffect(() => {
    carregarAparencia()
  }, [])

  async function carregarAparencia() {

    try {

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      const {
  data: restaurante,
  error: restauranteError,
} = await supabase
  .from("restaurantes")
  .select(`
    id,
    slug,
    premium,
    assinatura_status
  `)
  .eq("auth_user_id", user.id)
  .single()

      if (
        restauranteError ||
        !restaurante
      ) {

        console.log(restauranteError)

        setLoading(false)

        return
      }

setRestauranteId(
  restaurante.id
)

setSlug(
  restaurante.slug || ""
)

setPremium(
  restaurante.premium
)

setStatusAssinatura(
  restaurante.assinatura_status
)

console.log(
  "Premium:",
  restaurante.premium
)

console.log(
  "Status:",
  restaurante.assinatura_status
)


      /*
        BUSCA APENAS O MAIS RECENTE
      */

      const {
        data: aparencia,
        error: aparenciaError,
      } = await supabase
        .from("aparencia")
        .select("*")
        .eq(
          "restaurante_id",
          restaurante.id
        )
        .order(
          "created_at",
          { ascending: false }
        )
        .limit(1)
        .maybeSingle()

      if (
        aparenciaError &&
        aparenciaError.code !== "PGRST116"
      ) {

        console.log(
          aparenciaError
        )
      }

      if (aparencia) {

        setCategoriaRestaurante(
  aparencia.categoria_restaurante || ""
)

setTipoAtendimento(
  aparencia.tipo_atendimento || "Delivery"
)

setNomeRestaurante(
  aparencia.nome_restaurante || ""
)

setPedidoMinimo(
  aparencia.pedido_minimo || ""
)

        setSelectedColor(
          aparencia.cor_primaria ||
            "#556B2F"
        )

        

        setLogoPreview(
          aparencia.logo_url ||
            null
        )

        setBannerPreview(
          aparencia.banner_url ||
            null
        )
        setHorarios({
  seg_inicio: aparencia.horario_seg_inicio || "",
  seg_fim: aparencia.horario_seg_fim || "",

  ter_inicio: aparencia.horario_ter_inicio || "",
  ter_fim: aparencia.horario_ter_fim || "",

  qua_inicio: aparencia.horario_qua_inicio || "",
  qua_fim: aparencia.horario_qua_fim || "",

  qui_inicio: aparencia.horario_qui_inicio || "",
  qui_fim: aparencia.horario_qui_fim || "",

  sex_inicio: aparencia.horario_sex_inicio || "",
  sex_fim: aparencia.horario_sex_fim || "",

  sab_inicio: aparencia.horario_sab_inicio || "",
  sab_fim: aparencia.horario_sab_fim || "",

  dom_inicio: aparencia.horario_dom_inicio || "",
  dom_fim: aparencia.horario_dom_fim || "",
})
      }

    } catch (error) {

      console.log(error)

    } finally {

      setLoading(false)
    }
  }

  async function saveChanges() {

    if (!restauranteId) {

      alert(
        "Restaurante não encontrado"
      )

      return
    }

    try {

      /*
        PROCURA REGISTRO EXISTENTE
      */

      const {
        data: aparenciaExistente,
        error: buscaError,
      } = await supabase
        .from("aparencia")
        .select("id")
        .eq(
          "restaurante_id",
          restauranteId
        )
        .order(
          "created_at",
          { ascending: false }
        )
        .limit(1)
        .maybeSingle()

      if (buscaError) {

        console.log(
          buscaError
        )

        alert(
          "Erro ao buscar aparência"
        )

        return
      }

      /*
        UPDATE
      */

      if (aparenciaExistente) {

        console.log(
  "HORARIOS SALVANDO:",
  horarios
)

console.log(
  "HORARIOS SALVANDO:",
  horarios
)

console.log("ENVIANDO PARA SUPABASE:", {
  horario_seg_inicio: horarios.seg_inicio,
  horario_seg_fim: horarios.seg_fim,
})

const {
  error: updateError,
} = await supabase
  .from("aparencia")
  .update({

  categoria_restaurante:
    categoriaRestaurante,

  tipo_atendimento:
    tipoAtendimento,

    nome_restaurante:
  nomeRestaurante,

pedido_minimo:
  Number(pedidoMinimo),

  cor_primaria:
    selectedColor,

  logo_url:
    logoPreview,

  banner_url:
    bannerPreview,

    horario_seg_inicio:
      horarios.seg_inicio,

    horario_seg_fim:
      horarios.seg_fim,

    horario_ter_inicio:
      horarios.ter_inicio,

    horario_ter_fim:
      horarios.ter_fim,

    horario_qua_inicio:
      horarios.qua_inicio,

    horario_qua_fim:
      horarios.qua_fim,

    horario_qui_inicio:
      horarios.qui_inicio,

    horario_qui_fim:
      horarios.qui_fim,

    horario_sex_inicio:
      horarios.sex_inicio,

    horario_sex_fim:
      horarios.sex_fim,

    horario_sab_inicio:
      horarios.sab_inicio,

    horario_sab_fim:
      horarios.sab_fim,

    horario_dom_inicio:
      horarios.dom_inicio,

    horario_dom_fim:
      horarios.dom_fim,

  })
          .eq(
            "id",
            aparenciaExistente.id
          )

      if (updateError) {

  console.log(updateError)

  alert(
    "Erro ao atualizar aparência"
  )

  return
}

console.log("UPDATE OK")

} else {

/*
  INSERT
*/

        const {
          error: insertError,
        } = await supabase
          .from("aparencia")
         .insert({

  restaurante_id:
    restauranteId,

    nome_restaurante:
  nomeRestaurante,

pedido_minimo:
  Number(pedidoMinimo),

  categoria_restaurante:
    categoriaRestaurante,

  tipo_atendimento:
    tipoAtendimento,

  cor_primaria:
    selectedColor,

  logo_url:
    logoPreview,

  banner_url:
    bannerPreview,

  horario_seg_inicio:
    horarios.seg_inicio,

  horario_seg_fim:
    horarios.seg_fim,

  horario_ter_inicio:
    horarios.ter_inicio,

  horario_ter_fim:
    horarios.ter_fim,

  horario_qua_inicio:
    horarios.qua_inicio,

  horario_qua_fim:
    horarios.qua_fim,

  horario_qui_inicio:
    horarios.qui_inicio,

  horario_qui_fim:
    horarios.qui_fim,

  horario_sex_inicio:
    horarios.sex_inicio,

  horario_sex_fim:
    horarios.sex_fim,

  horario_sab_inicio:
    horarios.sab_inicio,

  horario_sab_fim:
    horarios.sab_fim,

  horario_dom_inicio:
    horarios.dom_inicio,

  horario_dom_fim:
    horarios.dom_fim,
})

        if (insertError) {

          console.log(
            insertError
          )

          alert(
            "Erro ao criar aparência"
          )

          return
        }
      }

      /*
        LIMPA CACHE
      */

      localStorage.removeItem(
  "aparencia-cache"
)

localStorage.setItem(
  "cardapio-primary-color",
  selectedColor
)

setSavedMessage(true)

      setTimeout(() => {

        setSavedMessage(false)

      }, 3000)

    } catch (error) {

      console.log(error)

      alert(
        "Erro inesperado"
      )
    }
  }

  async function handleBannerUpload(
  e: React.ChangeEvent<HTMLInputElement>
) {

  const file =
    e.target.files?.[0]

  if (!file) return

  try {

    setLoading(true)

    const fileExt =
      file.name.split(".").pop()

    const fileName =
      `${Date.now()}.${fileExt}`

    const filePath =
      `banner-${fileName}`

    const { error } =
      await supabase.storage

        .from("banners")

        .upload(
          filePath,
          file,
          {
            upsert: true,
          }
        )

    if (error) {

      console.log(error)

      return
    }

    const { data } =
      supabase.storage

        .from("banners")

        .getPublicUrl(
          filePath
        )

    setBannerPreview(
      data.publicUrl
    )

  } catch (error) {

    console.log(error)

  } finally {

    setLoading(false)
  }
}

  async function handleLogoUpload(
  event: React.ChangeEvent<HTMLInputElement>
) {

  const file =
    event.target.files?.[0]

  if (!file) return

  try {

    setLoading(true)

    const fileExt =
      file.name.split(".").pop()

    const fileName =
      `logo-${Date.now()}.${fileExt}`

    const { error } =
      await supabase.storage

        .from("logos")

        .upload(
          fileName,
          file,
          {
            cacheControl: "3600",
            upsert: true,
          }
        )

    if (error) {

      console.log(
        "Erro upload:",
        error
      )

      return
    }

    const { data } =
      supabase.storage

        .from("logos")

        .getPublicUrl(
          fileName
        )

    if (
      data?.publicUrl
    ) {

      setLogoPreview(
        data.publicUrl
      )
    }

  } catch (error) {

    console.log(error)

  } finally {

    setLoading(false)
  }
}

 function removeLogo() {

  setLogoPreview(null)

  if (logoInputRef.current) {

    logoInputRef.current.value = ""
  }
}

 function removeBanner() {

  setBannerPreview(null)

  if (bannerInputRef.current) {

    bannerInputRef.current.value = ""
  }
}

 

  if (loading) {

    return (
      <div className="
        min-h-screen
        flex
        items-center
        justify-center
        bg-black
        text-white
      ">
        Carregando aparência...
      </div>
    )
  }

  return (

    <main
      className={`${bgPage} min-h-screen p-6 md:p-10 transition-all`}
    >

      <div className="max-w-7xl mx-auto space-y-8">

        <div className="
          flex
          flex-col
          gap-4
          md:flex-row
          md:items-center
          md:justify-between
        ">

          <div>

            <div
  className="
    w-14
    h-14
    rounded-full
    bg-[#7F1D1D]
    flex
    items-center
    justify-center
    text-white
    mb-4
  "
>
  🎨
</div>

            <h1
              className={`text-4xl font-black ${textPrimary}`}
            >
              Aparência
            </h1>

            <p
              className={`${textSecondary} mt-2`}
            >
Personalize o visual e as informações do seu cardápio
            </p>

          </div>


</div>
        {
          savedMessage && (

            <div className="
              bg-green-500/20
              border
              border-green-500/40
              text-green-400
              rounded-2xl
              p-4
              font-semibold
            ">
              Alterações salvas com sucesso.
            </div>
          )
        }

        
<div
  className={`${cardBg} ${borderColor} border rounded-3xl p-6 shadow-sm`}
>

  <div className="flex items-start gap-3 mb-6">

    <div
      className="
        w-10
        h-10
        rounded-full
        bg-red-50
        flex
        items-center
        justify-center
      "
    >
      🍽️
    </div>

    <div>

      <h2
        className={`text-2xl font-bold ${textPrimary}`}
      >
        Informações do Restaurante
      </h2>

      <p
        className={`${textSecondary}`}
      >
        Essas informações aparecem no topo do cardápio.
      </p>

    </div>

  </div>

  <div className="space-y-6 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0 mt-6">

    <div>
      <label className="font-semibold">
        Categoria do restaurante
      </label>

      <input
  type="text"
  value={categoriaRestaurante}
  onChange={(e) =>
    setCategoriaRestaurante(e.target.value)
  }
  placeholder="Ex: Pizzaria, Hamburgueria, Açaiteria..."
  className="
    w-full
    mt-2
    border
    rounded-xl
    p-3
  "
/>
    </div>

<div className="mt-4">

  <label className="font-semibold">
    Nome do Restaurante
  </label>

  <input
    type="text"
    value={nomeRestaurante}
    onChange={(e) =>
      setNomeRestaurante(
        e.target.value
      )
    }
    placeholder="Ex: Minha Pizzaria"
    className="
      w-full
      mt-2
      border
      rounded-xl
      p-3
    "
  />

</div>

<div className="mt-4">

  <label className="font-semibold">
    Pedido mínimo
  </label>

  <input
    type="number"
    value={pedidoMinimo}
    onChange={(e) =>
      setPedidoMinimo(
        e.target.value
      )
    }
    placeholder="Ex: R$:49,00"
    className="
      w-full
      mt-2
      border
      rounded-xl
      p-3
    "
  />

</div>

<div>

  <label className="font-semibold">
    Tipo de atendimento
  </label>

<div className="
  grid
  grid-cols-2 md:grid-cols-3 lg:grid-cols-6
  gap-4
  mt-4
">

  {[
    "Delivery",
    "Retirada",
    "Salão",
    "Delivery + Retirada",
    "Delivery + Salão",
  ].map((tipo) => (

   <button
  key={tipo}
  type="button"
  onClick={() =>
    setTipoAtendimento(tipo)
  }
  className={`
    p-5
    rounded-2xl
    border
    font-semibold
    transition-all
    min-h-[120px]

    ${
      tipoAtendimento === tipo
        ? "border-red-700 bg-[#F7F1EC] text-red-700"
        : "border-zinc-200 bg-white"
    }
  `}
>

  <div
    className="
      flex
      flex-col
      items-center
      justify-center
      gap-2
    "
  >

   <span className="text-xl">

  {
    tipo === "Delivery"
      ? "🛵"
      : tipo === "Retirada"
      ? "🛍️"
      : tipo === "Salão"
      ? "🍽️"
      : tipo === "Delivery + Retirada"
      ? "🛵🛍️"
      : tipo === "Delivery + Salão"
      ? "🛵🍽️"
      : "⭐"
  }

</span>

 <span
  className="
    text-[11px]
    text-center
    leading-tight
    font-medium
  "
>
  {tipo}
</span> 

  </div>

</button> 

  ))}

</div>

    </div>

  </div>

</div>
     <div
  className="
    bg-white
    border
    border-[#DDD6CC]
    rounded-3xl
    p-6
    mt-6
  "
>

  <h2 className="text-2xl font-bold">
    Cor principal do cardápio
  </h2>

  <p className="text-zinc-500 mt-2">
    Escolha a identidade da sua marca
  </p>


  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-6">

    <button
      onClick={() =>
        setSelectedColor("#7F1D1D")
      }
      className={`
        border
        rounded-2xl
        p-5
        flex
        items-center
        gap-4

        ${
          selectedColor === "#7F1D1D"
            ? "border-red-700"
            : "border-zinc-200"
        }
      `}
    >

      <div
        className="w-10 h-10 rounded-full"
        style={{
          backgroundColor: "#7F1D1D"
        }}
      />

      <div>

        <div className="font-bold">
          Vinho
        </div>

        <div className="text-sm text-zinc-500">
          Elegante e marcante
        </div>

      </div>

    </button>

    <button
      onClick={() =>
        setSelectedColor("#18181B")
      }
      className={`
        border
        rounded-2xl
        p-5
        flex
        items-center
        gap-4

        ${
          selectedColor === "#18181B"
            ? "border-red-700"
            : "border-zinc-200"
        }
      `}
    >

      <div
        className="w-10 h-10 rounded-full"
        style={{
          backgroundColor: "#18181B"
        }}
      />

      <div>

        <div className="font-bold">
          Preto
        </div>

        <div className="text-sm text-zinc-500">
          Moderno e sofisticado
        </div>

      </div>

    </button>
     
<div
  className="
    border
    rounded-2xl
    p-5
  "
>

  <label className="font-bold">
    Personalizada
  </label>

  <input
    type="color"
    value={selectedColor}
    onChange={(e) =>
      setSelectedColor(e.target.value)
    }
    className="
      w-full
      h-12
      mt-3
      cursor-pointer
    "
  />

 <input
  value={selectedColor}
  onChange={(e) =>
    setSelectedColor(e.target.value)
  }
  className="
    mt-3
    w-full
    border
    rounded-xl
    p-2
  "
/>
</div>

<div className="mt-4">

  <p className="text-sm font-semibold mb-2">
    Prévia
  </p>

  <button
    className="
      w-full
      rounded-xl
      text-white
      font-bold
      py-3
    "
    style={{
      backgroundColor: selectedColor,
    }}
  >
    🛒 Exemplo de botão
  </button>

</div>

</div>

</div>

<div
  className="
    grid
    md:grid-cols-2
    gap-6
    mt-6
  "
>

          <div
            className={`${cardBg} ${borderColor} border rounded-3xl p-6`}
          >

            <div className="
              flex
              items-center
              justify-between
            ">

              <div>

                <h2
                  className={`text-3xl font-black ${textPrimary}`}
                >
                  Logo
                </h2>

                <p
                  className={`${textSecondary} mt-2`}
                >
                  Logo principal do restaurante
                </p>

              </div>

              {
                logoPreview && (

                  <button
                    onClick={
                      removeLogo
                    }
                    className="
                      bg-red-500
                      text-white
                      px-4
                      py-2
                      rounded-xl
                      text-sm
                      font-bold
                    "
                  >
                    Remover
                  </button>
                )
              }
            </div>

            <div className="mt-6 flex gap-4">

  <div
    onClick={() =>
      logoInputRef.current?.click()
    }
    className="
      w-24
      h-24
      rounded-full
      border
      border-zinc-200
      overflow-hidden
      cursor-pointer
      flex
      items-center
      justify-center
      bg-white
    "
  >

    {logoPreview ? (

      <img
        src={logoPreview}
        alt="Logo"
        className="
          w-full
          h-full
          object-cover
        "
      />

    ) : (

      <span className="text-zinc-400">
        Logo
      </span>

    )}

  </div>

  <div className="flex-1 space-y-3">

    <button
      type="button"
      onClick={() =>
        logoInputRef.current?.click()
      }
      className="
        w-full
        border
        rounded-xl
        py-3
        font-semibold
      "
    >
      Alterar logo
    </button>

    {logoPreview && (

      <button
        type="button"
        onClick={removeLogo}
        className="
          w-full
          border
          border-red-300
          text-red-600
          rounded-xl
          py-3
          font-semibold
        "
      >
        Remover
      </button>

    )}

    <p className="text-sm text-zinc-500">
      Formatos: PNG, JPG ou WEBP.
      <br />
      Tamanho recomendado: 512x512px
    </p>

  </div>

</div>    

            <input
              type="file"
              accept="image/*"
              ref={logoInputRef}
              className="hidden"
              onChange={
                handleLogoUpload
              }
            />

          </div>

          <div
            className={`${cardBg} ${borderColor} border rounded-3xl p-6`}
          >

            <div className="
              flex
              items-center
              justify-between
            ">

              <div>

                <h2
                  className={`text-3xl font-black ${textPrimary}`}
                >
                  Banner
                </h2>

                <p
                  className={`${textSecondary} mt-2`}
                >
                  Banner do topo do cardápio
                </p>

              </div>

              {
                bannerPreview && (

                  <button
                    onClick={
                      removeBanner
                    }
                    className="
                      bg-red-500
                      text-white
                      px-4
                      py-2
                      rounded-xl
                      text-sm
                      font-bold
                    "
                  >
                    Remover
                  </button>
                )
              }
            </div>

            <div className="mt-6 space-y-4">

  <div
    onClick={() =>
      bannerInputRef.current?.click()
    }
    className="
      h-32
      rounded-2xl
      overflow-hidden
      border
      border-zinc-200
      cursor-pointer
      bg-zinc-50
    "
  >

    {bannerPreview ? (

      <img
        src={bannerPreview}
        alt="Banner"
        className="
          w-full
          h-full
          object-cover
        "
      />

    ) : (

      <div
        className="
          h-full
          flex
          items-center
          justify-center
          text-zinc-400
        "
      >
        Banner
      </div>

    )}

  </div>

  <button
    type="button"
    onClick={() =>
      bannerInputRef.current?.click()
    }
    className="
      w-full
      border
      rounded-xl
      py-3
      font-semibold
    "
  >
    Alterar banner
  </button>

  {bannerPreview && (

    <button
      type="button"
      onClick={removeBanner}
      className="
        w-full
        border
        border-red-300
        text-red-600
        rounded-xl
        py-3
        font-semibold
      "
    >
      Remover
    </button>

  )}

  <p className="text-sm text-zinc-500">
    Formatos: PNG, JPG ou WEBP.
    <br />
    Tamanho recomendado: 1920x600px
  </p>

</div>

                       <input
              type="file"
              accept="image/*"
              ref={bannerInputRef}
              className="hidden"
              onChange={
                handleBannerUpload
              }
            />

          </div>
        </div>

        <div
  className="
    bg-white
    border
    border-[#DDD6CC]
    rounded-3xl
    p-6
    flex
    gap-4
    mt-6
  "
>

  <Link
    href={`/${slug}`}
    target="_blank"
    className="
      flex-1
      border
      rounded-2xl
      p-4
      text-center
      font-semibold
    "
  >
    👁 Ver Cardápio
  </Link>

  <button
    onClick={saveChanges}
    className="
      flex-1
      rounded-2xl
      text-white
      font-bold
    "
    style={{
      backgroundColor:
        selectedColor,
      padding: "16px",
    }}
  >
    Salvar Alterações
  </button>

</div>

      </div>
    </main>
  )
}