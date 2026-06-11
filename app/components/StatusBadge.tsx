interface StatusBadgeProps {
  status: string
}

const statusStyles = {
  pendente:
    "bg-amber-100 text-amber-700 border border-amber-200",

  aceito:
    "bg-green-100 text-green-700 border border-green-200",

  entrega:
    "bg-purple-100 text-purple-700 border border-purple-200",

  concluido:
    "bg-emerald-100 text-emerald-700 border border-emerald-200",
}

const statusLabels = {
  pendente: "Pendente",

  aceito: "Aceito",

  entrega: "Entrega",

  concluido: "Concluído",
}

export function StatusBadge({
  status,
}: StatusBadgeProps) {
  return (
    <span
      className={`
        px-3
        py-1
        rounded-full
        text-xs
        font-semibold
        uppercase
        tracking-wide
        ${
          statusStyles[
            status as keyof typeof statusStyles
          ]
        }
      `}
    >
      {
        statusLabels[
          status as keyof typeof statusLabels
        ]
      }
    </span>
  )
}