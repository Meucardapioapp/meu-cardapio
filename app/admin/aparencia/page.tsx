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

export default function AparenciaPage() {

  const [selectedColor, setSelectedColor] =
    useState("#556B2F")

  const [lightMode, setLightMode] =
    useState(true)

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

        setSelectedColor(
          aparencia.cor_primaria ||
            "#556B2F"
        )

        setLightMode(
          aparencia.tema !==
            "escuro"
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

      const tema = lightMode
        ? "claro"
        : "escuro"

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

    tema,

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

  tema,

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

  const bgPage = lightMode
    ? "bg-[#F4F1EA]"
    : "bg-black"

  const cardBg = lightMode
    ? "bg-[#ECE7DE]"
    : "bg-zinc-900"

  const borderColor = lightMode
    ? "border-[#D6D0C7]"
    : "border-zinc-800"

  const textPrimary = lightMode
    ? "text-zinc-900"
    : "text-white"

  const textSecondary = lightMode
    ? "text-zinc-600"
    : "text-zinc-400"

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

            <h1
              className={`text-5xl font-black ${textPrimary}`}
            >
              Aparência
            </h1>

            <p
              className={`${textSecondary} mt-2`}
            >
              Personalize o visual do seu cardápio
            </p>

          </div>

<div className="flex gap-3 mb-6">

  <a href="/admin/aparencia/restaurante">
    <Button variant="outline">
      Restaurante
    </Button>
  </a>

  <a href="/admin/aparencia/horarios">
    <Button variant="outline">
      Horários
    </Button>
  </a>

</div>
<div className="mb-6">

  {premium ? (

    <div
      className="
        inline-flex
        items-center
        gap-2
        px-4
        py-2
        rounded-full
        bg-green-500/20
        border
        border-green-500
        text-green-400
        font-semibold
      "
    >
      🟢 Premium Ativo
    </div>

  ) : (

    <div
      className="
        inline-flex
        items-center
        gap-2
        px-4
        py-2
        rounded-full
        bg-red-500/20
        border
        border-red-500
        text-red-400
        font-semibold
      "
    >
      🔴 Plano Inativo
    </div>

  )}

</div>

<div className="flex items-center gap-3">

            <Button
              variant="outline"
              onClick={() =>
                setLightMode(
                  !lightMode
                )
              }
              className="
                rounded-2xl
                px-6
              "
            >
              {
                lightMode
                  ? "Tema Escuro"
                  : "Tema Claro"
              }
            </Button>

            <Button
              onClick={
                saveChanges
              }
              className="
                rounded-2xl
                px-6
              "
              style={{
                backgroundColor:
                  selectedColor,
              }}
            >
              Salvar Alterações
            </Button>

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
          className={`${cardBg} ${borderColor} border rounded-3xl p-6`}
        >

          <h2
            className={`text-3xl font-black ${textPrimary}`}
          >
            Cor Principal
          </h2>

          <p
            className={`${textSecondary} mt-2`}
          >
            Escolha a identidade da sua marca
          </p>

          <div className="
            flex
            flex-wrap
            gap-4
            mt-8
          ">

            {
              colors.map(
                (color) => (

                  <button
                    key={color}
                    onClick={() =>
                      setSelectedColor(
                        color
                      )
                    }
                    className="
                      w-14
                      h-14
                      rounded-2xl
                      border-4
                      hover:scale-110
                      transition-all
                    "
                    style={{
                      backgroundColor:
                        color,

                      borderColor:
                        selectedColor ===
                        color
                          ? "#ffffff"
                          : "transparent",
                    }}
                  />
                )
              )
            }

          </div>
        </div>

        <div className="
          grid
          lg:grid-cols-2
          gap-6
        ">

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

            <div
              onClick={() =>
                logoInputRef.current?.click()
              }
              className="
                mt-6
                h-72
                border-2
                border-dashed
                border-zinc-600
                rounded-3xl
                flex
                items-center
                justify-center
                cursor-pointer
                overflow-hidden
              "
            >

              {
                logoPreview ? (

                  <img
                    src={logoPreview}
                    alt="Logo"
                    className="
                      w-full
                      h-full
                      object-contain
                      bg-white
                    "
                  />

                ) : (

                  <div className="text-center">

                    <p
                      className={`font-bold ${textPrimary}`}
                    >
                      Clique para enviar logo
                    </p>

                  </div>
                )
              }

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

            <div
              onClick={() =>
                bannerInputRef.current?.click()
              }
              className="
                mt-6
                h-72
                border-2
                border-dashed
                border-zinc-600
                rounded-3xl
                flex
                items-center
                justify-center
                cursor-pointer
                overflow-hidden
              "
            >

              {
                bannerPreview ? (

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

                  <div className="text-center">

                    <p
                      className={`font-bold ${textPrimary}`}
                    >
                      Clique para enviar banner
                    </p>

                  </div>
                )
              }

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

      </div>
    </main>
  )
}