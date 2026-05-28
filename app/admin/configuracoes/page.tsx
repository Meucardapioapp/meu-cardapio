"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function ConfiguracoesPage() {
  return (
    <main className="space-y-8 pb-10">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-white">
            Configurações
          </h1>

          <p className="text-zinc-400 mt-2">
            Gerencie sua conta e personalize seu restaurante
          </p>
        </div>

        <Button className="bg-green-500 hover:bg-green-400 text-black font-bold rounded-2xl h-12 px-6 shadow-lg shadow-green-500/20">
          Salvar Tudo
        </Button>
      </div>

      {/* PERFIL */}
      <div className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-800/80 rounded-3xl p-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-3xl font-black text-black shadow-lg shadow-green-500/20">
            M
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white">
              Meu Restaurante
            </h2>

            <p className="text-zinc-400 mt-1">
              Plano Professional
            </p>
          </div>
        </div>
      </div>

      {/* GRID */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* CONTA */}
        <div className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-800/80 rounded-3xl p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white">
              Conta
            </h2>

            <p className="text-zinc-400 mt-1">
              Informações pessoais da conta
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="text-sm font-medium text-zinc-300">
                Nome
              </label>

              <Input
                placeholder="Seu nome"
                className="mt-2 h-12 rounded-2xl bg-zinc-950/80 border-zinc-700 focus:border-green-500 text-white placeholder:text-zinc-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-zinc-300">
                Email
              </label>

              <Input
                placeholder="seuemail@gmail.com"
                className="mt-2 h-12 rounded-2xl bg-zinc-950/80 border-zinc-700 focus:border-green-500 text-white placeholder:text-zinc-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-zinc-300">
                WhatsApp
              </label>

              <Input
                placeholder="(92) 99999-9999"
                className="mt-2 h-12 rounded-2xl bg-zinc-950/80 border-zinc-700 focus:border-green-500 text-white placeholder:text-zinc-500"
              />
            </div>

            <Button className="w-full h-12 rounded-2xl bg-green-500 hover:bg-green-400 text-black font-bold shadow-lg shadow-green-500/20">
              Salvar Alterações
            </Button>
          </div>
        </div>

        {/* RESTAURANTE */}
        <div className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-800/80 rounded-3xl p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white">
              Restaurante
            </h2>

            <p className="text-zinc-400 mt-1">
              Informações exibidas aos clientes
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="text-sm font-medium text-zinc-300">
                Nome do Restaurante
              </label>

              <Input
                placeholder="Meu Restaurante"
                className="mt-2 h-12 rounded-2xl bg-zinc-950/80 border-zinc-700 focus:border-green-500 text-white placeholder:text-zinc-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-zinc-300">
                Taxa de Entrega
              </label>

              <Input
                placeholder="R$ 5,00"
                className="mt-2 h-12 rounded-2xl bg-zinc-950/80 border-zinc-700 focus:border-green-500 text-white placeholder:text-zinc-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-zinc-300">
                Tempo Médio de Entrega
              </label>

              <Input
                placeholder="30-40 min"
                className="mt-2 h-12 rounded-2xl bg-zinc-950/80 border-zinc-700 focus:border-green-500 text-white placeholder:text-zinc-500"
              />
            </div>

            <Button className="w-full h-12 rounded-2xl bg-green-500 hover:bg-green-400 text-black font-bold shadow-lg shadow-green-500/20">
              Salvar Restaurante
            </Button>
          </div>
        </div>
      </div>

      {/* SEGURANÇA */}
      <div className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-800/80 rounded-3xl p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Segurança
            </h2>

            <p className="text-zinc-400 mt-1">
              Gerencie senha e segurança da conta
            </p>
          </div>

          <Button
            variant="outline"
            className="border-zinc-700 bg-zinc-950 text-white hover:bg-zinc-800 rounded-2xl"
          >
            Alterar Senha
          </Button>
        </div>
      </div>
    </main>
  )
}