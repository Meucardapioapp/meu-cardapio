"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BellRing, Mail, MessageCircle } from "lucide-react";
import { apiFetch } from "@/utils/apiFetch";
import { CartaoCelular, Chave } from "../components/CartaoCelular";

type Config = {
  push: boolean;
  email: boolean;
  emailDestino: string | null;
  whatsapp: boolean;
  whatsappCliente: boolean;
};

export default function NotificacoesPage() {
  const [config, setConfig] = useState<Config | null>(null);

  useEffect(() => {
    apiFetch("/api/painel/notificacoes")
      .then((r) => r.json())
      .then((d) => d?.success && setConfig(d))
      .catch(() => {});
  }, []);

  async function alternarWhatsapp() {
    if (!config) return;
    const novo = !config.whatsappCliente;
    setConfig({ ...config, whatsappCliente: novo });
    const r = await apiFetch("/api/painel/notificacoes", {
      method: "PUT",
      body: JSON.stringify({ whatsappCliente: novo }),
    }).catch(() => null);
    if (!r?.ok) {
      setConfig((c) => (c ? { ...c, whatsappCliente: !novo } : c));
      toast.error("Não foi possível salvar.");
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-black text-zinc-900 sm:text-3xl">Notificações</h1>
      <p className="mt-1 text-sm text-zinc-500">Avisos automáticos para você e para seus clientes.</p>

      <div className="mt-6 space-y-3">
        <CartaoCelular />

        <div className="rounded-2xl border bg-white p-5">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-700">
              <MessageCircle size={22} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-bold">WhatsApp automático para o cliente</p>
              <p className="mt-1 text-sm text-zinc-500">
                {config && !config.whatsapp
                  ? "Em breve: o cliente recebe no WhatsApp quando o pedido é aceito, sai para entrega e é concluído. Enquanto isso, use o botão de WhatsApp em cada pedido."
                  : "O cliente recebe uma mensagem quando você aceita o pedido, quando sai para entrega (ou fica pronto) e quando conclui."}
              </p>
            </div>
            <Chave
              ligado={Boolean(config?.whatsappCliente)}
              desabilitado={!config?.whatsapp}
              onClick={alternarWhatsapp}
            />
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <Mail size={22} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-bold">E-mails do seu plano</p>
              <p className="mt-1 text-sm text-zinc-500">
                Enviamos para <strong>{config?.emailDestino || "o e-mail da sua conta"}</strong>: pagamento confirmado,
                plano perto de vencer e cardápio fora do ar. Não precisa configurar nada.
              </p>
            </div>
            <BellRing size={20} className="mt-1 shrink-0 text-zinc-400" />
          </div>
        </div>
      </div>
    </div>
  );
}
