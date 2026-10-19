"use client";

import { ReactNode, useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, LocateFixed, MapPin, Plus, Route, Trash2 } from "lucide-react";
import { apiFetch } from "@/utils/apiFetch";

type Faixa = { ate_km: string; valor: string };
type Modo = "bairro" | "km";

const paraNumero = (v: string) => Number(String(v).replace(",", "."));
const reais = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const FAIXAS_EXEMPLO: Faixa[] = [
  { ate_km: "3", valor: "5" },
  { ate_km: "6", valor: "8" },
  { ate_km: "10", valor: "12" },
];

/**
 * Escolha de como cobrar a entrega. "Por bairro" mostra a tabela de bairros
 * (children); "Por distância" mostra as faixas de km e a localização do restaurante.
 */
export default function CobrancaEntrega({ children }: { children: ReactNode }) {
  const [carregando, setCarregando] = useState(true);
  const [modo, setModo] = useState<Modo>("bairro");
  const [modoSalvo, setModoSalvo] = useState<Modo>("bairro");
  const [faixas, setFaixas] = useState<Faixa[]>([]);
  const [localizado, setLocalizado] = useState(false);
  const [temEndereco, setTemEndereco] = useState(false);
  const [ocupado, setOcupado] = useState<string | null>(null);

  function aplicar(d: any) {
    const m: Modo = d?.modo === "km" ? "km" : "bairro";
    setModo(m);
    setModoSalvo(m);
    const lista = Array.isArray(d?.faixas) ? d.faixas : [];
    setFaixas(
      lista.length
        ? lista.map((f: any) => ({ ate_km: String(f.ate_km).replace(".", ","), valor: String(f.valor).replace(".", ",") }))
        : FAIXAS_EXEMPLO
    );
    setLocalizado(d?.latitude != null && d?.longitude != null);
  }

  useEffect(() => {
    apiFetch("/api/painel/frete")
      .then((r) => r.json())
      .then((d) => {
        if (d?.success) {
          aplicar(d);
          setTemEndereco(Boolean(d.temEndereco));
        }
      })
      .catch(() => {})
      .finally(() => setCarregando(false));
  }, []);

  async function enviar(corpo: object, rotulo: string, sucesso: string) {
    setOcupado(rotulo);
    try {
      const d = await apiFetch("/api/painel/frete", { method: "PUT", body: JSON.stringify(corpo) }).then((r) => r.json());
      if (!d?.success) {
        toast.error(d?.error || "Não foi possível salvar.");
        return false;
      }
      const modoAtual = modo;
      aplicar(d);
      if (rotulo !== "salvar") setModo(modoAtual); // localizar não muda a aba aberta
      toast.success(sucesso);
      return true;
    } finally {
      setOcupado(null);
    }
  }

  function salvar(novoModo: Modo) {
    const lista = faixas
      .map((f) => ({ ate_km: paraNumero(f.ate_km), valor: paraNumero(f.valor) }))
      .filter((f) => f.ate_km > 0 && f.valor >= 0);

    if (novoModo === "km") {
      if (lista.length === 0) return toast.warning("Cadastre pelo menos uma faixa de distância.");
      if (!localizado) return toast.warning("Marque primeiro onde fica o restaurante no mapa.");
    }

    enviar(
      { acao: "salvar", modo: novoModo, faixas: lista },
      "salvar",
      novoModo === "km" ? "Pronto! A entrega agora é cobrada pela distância." : "Pronto! A entrega volta a ser cobrada por bairro."
    );
  }

  function usarGps() {
    if (!navigator.geolocation) return toast.error("Este aparelho não informa a localização.");
    setOcupado("gps");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setOcupado(null);
        enviar(
          { acao: "minha_localizacao", latitude: pos.coords.latitude, longitude: pos.coords.longitude },
          "gps",
          "Localização do restaurante salva."
        );
      },
      () => {
        setOcupado(null);
        toast.error("Não conseguimos sua localização. Permita o acesso à localização no navegador.");
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  const botaoModo = (m: Modo, titulo: string, texto: string, Icone: typeof MapPin) => (
    <button
      type="button"
      onClick={() => setModo(m)}
      className={`flex-1 text-left rounded-2xl border-2 p-4 transition ${
        modo === m ? "border-[#7A1F3D] bg-[#7A1F3D]/5" : "border-zinc-200 bg-white hover:border-zinc-300"
      }`}
    >
      <div className="flex items-center gap-2">
        <Icone size={18} className={modo === m ? "text-[#7A1F3D]" : "text-zinc-400"} />
        <span className="font-bold text-zinc-900">{titulo}</span>
        {modoSalvo === m && (
          <span className="ml-auto text-[11px] font-bold uppercase tracking-wide text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
            Em uso
          </span>
        )}
      </div>
      <p className="text-sm text-zinc-500 mt-1">{texto}</p>
    </button>
  );

  if (carregando) {
    return (
      <div className="rounded-2xl bg-white border p-6 mb-6 flex items-center gap-2 text-zinc-500">
        <Loader2 size={18} className="animate-spin" /> Carregando…
      </div>
    );
  }

  return (
    <>
      <div className="rounded-2xl bg-white border p-5 mb-6">
        <p className="font-bold text-zinc-900">Como você cobra a entrega?</p>
        <div className="mt-3 flex flex-col sm:flex-row gap-3">
          {botaoModo("bairro", "Por bairro", "Um valor para cada bairro atendido.", MapPin)}
          {botaoModo("km", "Por distância", "Valor por faixa de km, calculado pelo endereço do cliente.", Route)}
        </div>

        {modo === "bairro" && modoSalvo === "km" && (
          <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900 flex flex-col sm:flex-row sm:items-center gap-3">
            <span className="flex-1">Hoje a entrega está sendo cobrada pela distância. Quer voltar a cobrar por bairro?</span>
            <button
              onClick={() => salvar("bairro")}
              disabled={ocupado !== null}
              className="h-10 px-4 rounded-xl bg-amber-600 text-white font-bold disabled:opacity-60"
            >
              Usar cobrança por bairro
            </button>
          </div>
        )}
      </div>

      {modo === "bairro" ? (
        children
      ) : (
        <div className="rounded-2xl bg-white border p-5 space-y-6">
          {/* 1. Onde fica o restaurante */}
          <div>
            <p className="font-bold text-zinc-900">1. Onde fica o restaurante</p>
            <p className="text-sm text-zinc-500 mt-1">A distância é medida em linha reta daqui até o endereço do cliente.</p>

            <div
              className={`mt-3 rounded-xl p-4 text-sm ${
                localizado ? "bg-green-50 border border-green-200 text-green-800" : "bg-zinc-50 border text-zinc-600"
              }`}
            >
              {localizado ? "✓ Localização do restaurante marcada." : "Localização ainda não marcada."}
            </div>

            <div className="mt-3 flex flex-col sm:flex-row gap-3">
              <button
                onClick={usarGps}
                disabled={ocupado !== null}
                className="h-11 px-4 rounded-xl bg-[#7A1F3D] text-white font-bold flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {ocupado === "gps" ? <Loader2 size={16} className="animate-spin" /> : <LocateFixed size={16} />}
                Estou no restaurante agora
              </button>
              <button
                onClick={() => enviar({ acao: "localizar_endereco" }, "endereco", "Localização encontrada pelo endereço.")}
                disabled={ocupado !== null || !temEndereco}
                title={temEndereco ? "" : "Cadastre o endereço em Endereço para retirada"}
                className="h-11 px-4 rounded-xl border font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {ocupado === "endereco" ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />}
                Usar o endereço cadastrado
              </button>
            </div>
          </div>

          {/* 2. Faixas */}
          <div>
            <p className="font-bold text-zinc-900">2. Valor por distância</p>
            <p className="text-sm text-zinc-500 mt-1">
              Endereços acima da última faixa ficam fora da área de entrega.
            </p>

            <div className="mt-3 space-y-2">
              {faixas.map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-sm text-zinc-500 w-8 shrink-0">até</span>
                  <div className="flex items-center h-11 rounded-xl border px-3 w-24">
                    <input
                      value={f.ate_km}
                      onChange={(e) =>
                        setFaixas((l) => l.map((x, j) => (j === i ? { ...x, ate_km: e.target.value.replace(/[^\d,.]/g, "").slice(0, 5) } : x)))
                      }
                      inputMode="decimal"
                      className="w-full outline-none font-semibold"
                      aria-label="Distância máxima em km"
                    />
                    <span className="text-sm text-zinc-500">km</span>
                  </div>
                  <span className="text-sm text-zinc-500">=</span>
                  <div className="flex items-center h-11 rounded-xl border px-3 w-28">
                    <span className="text-sm text-zinc-500 mr-1">R$</span>
                    <input
                      value={f.valor}
                      onChange={(e) =>
                        setFaixas((l) => l.map((x, j) => (j === i ? { ...x, valor: e.target.value.replace(/[^\d,.]/g, "").slice(0, 6) } : x)))
                      }
                      inputMode="decimal"
                      className="w-full outline-none font-semibold"
                      aria-label="Valor da entrega"
                    />
                  </div>
                  <button
                    onClick={() => setFaixas((l) => l.filter((_, j) => j !== i))}
                    className="h-11 w-11 rounded-xl text-zinc-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center"
                    aria-label="Remover faixa"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            {faixas.length < 20 && (
              <button
                onClick={() => {
                  const ultimo = paraNumero(faixas[faixas.length - 1]?.ate_km || "0") || 0;
                  setFaixas((l) => [...l, { ate_km: String(ultimo + 3), valor: "" }]);
                }}
                className="mt-3 text-sm font-bold text-[#7A1F3D] flex items-center gap-1"
              >
                <Plus size={16} /> Adicionar faixa
              </button>
            )}

            {faixas.length > 0 && (
              <p className="mt-3 text-xs text-zinc-500">
                Exemplo: cliente a{" "}
                {String(paraNumero(faixas[0].ate_km) || 0).replace(".", ",")} km paga{" "}
                {reais(paraNumero(faixas[0].valor) || 0)} de entrega.
              </p>
            )}
          </div>

          <button
            onClick={() => salvar("km")}
            disabled={ocupado !== null}
            className="w-full sm:w-auto h-12 px-6 rounded-xl bg-[#7A1F3D] text-white font-black flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {ocupado === "salvar" && <Loader2 size={16} className="animate-spin" />}
            {modoSalvo === "km" ? "Salvar faixas" : "Salvar e cobrar por distância"}
          </button>
        </div>
      )}
    </>
  );
}
