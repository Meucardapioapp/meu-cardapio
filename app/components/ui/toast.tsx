"use client"

type ToastProps = {
  tipo: "sucesso" | "erro" | "aviso"
  titulo: string
  mensagem: string
}

export default function Toast({
  tipo,
  titulo,
  mensagem,
}: ToastProps) {

  const estilos = {
    sucesso: {
      bg: "bg-green-50",
      border: "border-green-200",
      text: "text-green-800",
      icon: "✓",
    },
    erro: {
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-800",
      icon: "✕",
    },
    aviso: {
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      text: "text-yellow-800",
      icon: "⚠",
    },
  }

  const estilo = estilos[tipo]

  return (
    <div
      className={`
        fixed
        top-5
        right-5
        z-50
        w-[380px]
        rounded-3xl
        border
        p-5
        shadow-xl
        animate-in
        slide-in-from-top-4
        duration-300
        ${estilo.bg}
        ${estilo.border}
      `}
    >
      <div className="flex gap-4">

        <div className="text-2xl">
          {estilo.icon}
        </div>

        <div>

          <h3
            className={`
              font-bold
              ${estilo.text}
            `}
          >
            {titulo}
          </h3>

          <p
            className={`
              mt-1
              text-sm
              ${estilo.text}
            `}
          >
            {mensagem}
          </p>

        </div>

      </div>
    </div>
  )
}