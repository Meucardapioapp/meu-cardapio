"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, ShieldAlert, ShieldCheck } from "lucide-react";
import { apiFetch } from "@/utils/apiFetch";
import { comprimirImagem } from "@/lib/imagem";

type Item = { grupo: string; nome: string; ok: boolean; detalhe: string; acao?: "criptografar" };

/** Painel de segurança do dono da plataforma: roda os testes e mostra o resultado. */
export default function SegurancaPage() {
  const [itens, setItens] = useState<Item[] | null>(null);
  const [erro, setErro] = useState("");
  const [criptografando, setCriptografando] = useState(false);

  async function criptografar() {
    setCriptografando(true);
    try {
      const d = await apiFetch("/api/plataforma/criptografar-dados", { method: "POST" }).then((r) => r.json());
      if (!d?.success) {
        setErro(d?.error || "Não foi possível criptografar.");
        return;
      }
      await rodar();
    } finally {
      setCriptografando(false);
    }
  }

  async function rodar() {
    setItens(null);
    setErro("");
    const resposta = await apiFetch("/api/plataforma/diagnostico");
    if (resposta.status === 403) {
      setErro("Só o dono da plataforma (OWNER_USER_ID) pode ver esta página.");
      return;
    }
    const d = await resposta.json().catch(() => null);
    if (!d?.success) {
      setErro(d?.error || "Não foi possível rodar o teste.");
      return;
    }
    setItens(d.itens);
  }

  useEffect(() => {
    rodar();
  }, []);

  const grupos = itens ? [...new Set(itens.map((i) => i.grupo))] : [];
  const falhas = itens?.filter((i) => !i.ok).length ?? 0;

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-black text-zinc-900">Teste de segurança</h1>
        <p className="mt-1 text-zinc-500">
          Tenta invadir o sistema com a chave pública (como um hacker faria) e confere as configurações secretas.
        </p>

        {erro && <p className="mt-6 rounded-xl bg-red-50 p-4 text-red-700">{erro}</p>}

        {!itens && !erro && (
          <div className="mt-10 flex justify-center">
            <Loader2 className="animate-spin text-zinc-400" />
          </div>
        )}

        {itens && (
          <>
            <div
              className={`mt-6 rounded-2xl p-5 flex items-center gap-3 ${
                falhas ? "bg-amber-50 text-amber-900" : "bg-green-50 text-green-900"
              }`}
            >
              {falhas ? <ShieldAlert size={28} /> : <ShieldCheck size={28} />}
              <p className="font-bold">
                {falhas ? `${falhas} ponto(s) para resolver` : "Tudo protegido"}
              </p>
            </div>

            {grupos.map((g) => (
              <section key={g} className="mt-6">
                <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">{g}</h2>
                <div className="rounded-2xl bg-white border divide-y">
                  {itens.filter((i) => i.grupo === g).map((i) => (
                    <div key={i.nome} className="flex items-start gap-3 p-4">
                      {i.ok ? (
                        <CheckCircle2 className="text-green-600 shrink-0" size={20} />
                      ) : (
                        <ShieldAlert className="text-red-600 shrink-0" size={20} />
                      )}
                      <div>
                        <p className="font-semibold text-zinc-900">{i.nome}</p>
                        <p className={`text-sm ${i.ok ? "text-zinc-500" : "text-red-700"}`}>{i.detalhe}</p>
                        {i.acao === "criptografar" && (
                          <button
                            onClick={criptografar}
                            disabled={criptografando}
                            className="mt-2 h-10 px-4 rounded-xl bg-[#6D1F2F] text-white text-sm font-bold disabled:opacity-60 inline-flex items-center gap-2"
                          >
                            {criptografando && <Loader2 size={16} className="animate-spin" />}
                            Criptografar agora
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}

            <button onClick={rodar} className="mt-6 h-12 px-5 rounded-xl bg-[#6D1F2F] text-white font-bold">
              Rodar de novo
            </button>
          </>
        )}

        {itens && <OtimizarFotos />}
      </div>
    </main>
  );
}

/** Deixa leves as fotos que os restaurantes já tinham enviado (cardápio abre mais rápido). */
function OtimizarFotos() {
  const [estado, setEstado] = useState<"parado" | "rodando" | "fim">("parado");
  const [progresso, setProgresso] = useState({ feitas: 0, total: 0, trocadas: 0, economia: 0, falhas: 0 });

  async function rodar() {
    setEstado("rodando");
    const d = await apiFetch("/api/plataforma/fotos").then((r) => r.json()).catch(() => null);
    const fotos: { tabela: string; campo: string; chave: string; url: string }[] = d?.fotos ?? [];
    const p = { feitas: 0, total: fotos.length, trocadas: 0, economia: 0, falhas: 0 };
    setProgresso({ ...p });

    let i = 0;
    async function trabalhar() {
      while (i < fotos.length) {
        const f = fotos[i++];
        try {
          const original = await fetch(f.url, { mode: "cors", cache: "no-store" }).then((r) => {
            if (!r.ok) throw new Error(String(r.status));
            return r.blob();
          });
          // Já está leve: deixa como está.
          if (original.size > 180 * 1024) {
            const leve = await comprimirImagem(original, {
              maxLado: f.campo === "banner_url" ? 1600 : f.campo === "logo_url" ? 512 : 1200,
              qualidade: f.campo === "logo_url" ? 0.85 : 0.78,
            });
            if (leve.size < original.size * 0.8 && /webp|jpeg/.test(leve.type)) {
              const form = new FormData();
              form.set("tabela", f.tabela);
              form.set("campo", f.campo);
              form.set("chave", f.chave);
              form.set("url", f.url);
              form.set("arquivo", leve);
              const r = await apiFetch("/api/plataforma/fotos", { method: "POST", body: form }).then((x) => x.json());
              if (r?.success && !r.pulada) {
                p.trocadas++;
                p.economia += original.size - leve.size;
              } else if (!r?.success) p.falhas++;
            }
          }
        } catch {
          p.falhas++;
        }
        p.feitas++;
        setProgresso({ ...p });
      }
    }
    await Promise.all([trabalhar(), trabalhar(), trabalhar()]);
    setEstado("fim");
  }

  const mb = (b: number) => (b / 1024 / 1024).toLocaleString("pt-BR", { maximumFractionDigits: 1 });

  return (
    <section className="mt-10 rounded-2xl bg-white border p-5">
      <h2 className="text-lg font-bold text-zinc-900">Fotos dos cardápios</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Diminui as fotos de produtos, logos e banners que já foram enviadas sem compressão. O cardápio abre bem mais rápido no 4G.
        As fotos originais continuam guardadas. Deixe esta aba aberta até terminar.
      </p>
      {estado !== "parado" && (
        <div className="mt-4">
          <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
            <div
              className="h-full rounded-full bg-[#6D1F2F] transition-all"
              style={{ width: `${progresso.total ? (progresso.feitas / progresso.total) * 100 : 0}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-zinc-600">
            {progresso.feitas} de {progresso.total} conferidas · {progresso.trocadas} otimizadas · {mb(progresso.economia)} MB a menos
            {progresso.falhas ? ` · ${progresso.falhas} com erro` : ""}
          </p>
        </div>
      )}
      <button
        onClick={rodar}
        disabled={estado === "rodando"}
        className="mt-4 h-11 px-5 rounded-xl bg-[#6D1F2F] text-white text-sm font-bold disabled:opacity-60 inline-flex items-center gap-2"
      >
        {estado === "rodando" && <Loader2 size={16} className="animate-spin" />}
        {estado === "rodando" ? "Otimizando..." : estado === "fim" ? "Rodar de novo" : "Deixar fotos leves"}
      </button>
    </section>
  );
}
