"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Wallet,
  DollarSign,
  Clock3,
  Percent,
  CheckCircle2,
  Landmark,
  Send,
  ShieldCheck,
  Filter,
  Info,
  Settings,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const TAXA_SAQUE = 3.67;

type Saque = {
  id: string;
  valor: number;
  taxa: number;
  valor_liquido: number;
  status: string;
  created_at: string;
  pago_em: string | null;
};

export default function SaquesPage() {
const [saldoTotal, setSaldoTotal] = useState(0);

const [saldoDisponivel, setSaldoDisponivel] = useState(0);

const [saldoProcessando, setSaldoProcessando] = useState(0);

const [saldoTransferido, setSaldoTransferido] = useState(0);

const [carregandoSaldo, setCarregandoSaldo] = useState(true);

const [historico, setHistorico] = useState<Saque[]>([]);

const [dadosBancarios, setDadosBancarios] = useState<any>(null);

const [valor, setValor] = useState("");

const [restauranteId, setRestauranteId] =
  useState<string | null>(null);

  const valorNumerico = useMemo(() => {
    return Number(valor.replace(/\./g, "").replace(",", ".")) || 0;
  }, [valor]);

  const liquido = Math.max(valorNumerico - TAXA_SAQUE, 0);

useEffect(() => {
  const id = localStorage.getItem("restaurante_id");

  if (!id) {
    window.location.href = "/login";
    return;
  }

  setRestauranteId(id);
}, []);

useEffect(() => {
  if (!restauranteId) return;

  carregarSaldo();
  carregarHistorico();
  carregarDadosBancarios();

  const interval = setInterval(() => {
    carregarSaldo();
    carregarHistorico();
  }, 10000);

  return () => {
    clearInterval(interval);
  };

}, [restauranteId]);

useEffect(() => {
  setValor(
    saldoDisponivel
      .toFixed(2)
      .replace(".", ",")
  );
}, [saldoDisponivel]);

async function carregarSaldo() {
  try {
    setCarregandoSaldo(true);

if (!restauranteId) {
  window.location.href = "/login";
  return;
}

    const response = await fetch(
      `/api/pagarme/saldo?restauranteId=${restauranteId}`
    );

    const json = await response.json();

    if (!json.success) {
      console.error(json.error);
      return;
    }

    setSaldoTotal(json.saldoTotal);

    setSaldoDisponivel(json.saldoDisponivel);

    setSaldoProcessando(json.saldoProcessando);

    setSaldoTransferido(json.saldoTransferido);

  } catch (err) {
    console.error(err);
  } finally {
    setCarregandoSaldo(false);
  }
}

async function carregarHistorico() {

  try {

if (!restauranteId) {
  window.location.href = "/login";
  return;
}

    const response = await fetch(
      `/api/saques?restauranteId=${restauranteId}`
    );

    const json = await response.json();

    if (!json.success) return;

    setHistorico(json.saques);

  } catch (err) {

    console.error(err);

  }

}

async function carregarDadosBancarios() {

  if (!restauranteId) return;

  const response = await fetch(
    `/api/restaurante?restauranteId=${restauranteId}`
  );

  console.log("STATUS:", response.status);

  const json = await response.json();

  console.log("RESPOSTA API:", json);

  if (!json.success) {
    console.error(json.error);
    return;
  }

  const bancos: Record<string, string> = {
  "001": "Banco do Brasil",
  "003": "Banco da Amazônia",
  "004": "Banco do Nordeste",
  "007": "BNDES",
  "010": "Credicoamo",
  "011": "Credit Suisse",
  "012": "Banco Inbursa",
  "021": "Banestes",
  "024": "Banco BANDEPE",
  "025": "Banco Alfa",
  "029": "Banco Itaú Consignado",
  "033": "Santander",
  "036": "Banco Bradesco BBI",
  "037": "Banco do Estado do Pará",
  "040": "Banco Cargill",
  "041": "Banrisul",
  "047": "Banco do Estado de Sergipe",
  "060": "Confidence Corretora",
  "062": "Hipercard Banco",
  "063": "Banco Bradescard",
  "064": "Goldman Sachs",
  "065": "AndBank",
  "066": "Banco Morgan Stanley",
  "069": "Banco Crefisa",
  "070": "BRB",
  "074": "Banco J. Safra",
  "075": "Banco ABN AMRO",
  "076": "Banco KDB",
  "077": "Banco Inter",
  "078": "Haitong",
  "079": "Banco Original do Agronegócio",
  "080": "BTG Pactual",
  "081": "BancoSeguro",
  "082": "Banco Topázio",
  "083": "Banco da China",
  "084": "Uniprime",
  "085": "Cooperativa Ailos",
  "089": "Cooperativa Credisan",
  "091": "Unicred",
  "094": "Banco Finaxis",
  "095": "Banco Confidence",
  "096": "Banco B3",
  "097": "Credisis",
  "099": "Uniprime Norte",
  "104": "Caixa Econômica Federal",
  "107": "Banco Bocom BBM",
  "121": "Agibank",
  "133": "Cresol",
  "136": "Unicred",
  "149": "Facta Financeira",
  "157": "ICBC do Brasil",
  "169": "Banco Olé",
  "184": "Banco Itaú BBA",
  "197": "Stone",
  "208": "BTG Pactual",
  "212": "Banco Original",
  "213": "Banco Arbi",
  "217": "Banco John Deere",
  "218": "Banco BS2",
  "222": "Banco Crédit Agricole",
  "224": "Banco Fibra",
  "233": "Banco Cifra",
  "237": "Bradesco",
  "241": "Banco Clássico",
  "243": "Banco Máxima",
  "246": "Banco ABC Brasil",
  "249": "Banco Investcred",
  "250": "BCV",
  "254": "Paraná Banco",
  "260": "Nubank",
  "265": "Banco Fator",
  "266": "Banco Cédula",
  "268": "Bari",
  "269": "HSBC",
  "270": "Sagitur",
  "271": "IBC Bank",
  "272": "AGK",
  "273": "CCR",
  "274": "Money Plus",
  "276": "Senff",
  "278": "Genial Investimentos",
  "279": "Cooperativa Paraná",
  "280": "Avista",
  "281": "Cooperativa Coopnore",
  "283": "RB Capital",
  "285": "Frente Corretora",
  "286": "Cooperativa CrediSul",
  "288": "Carol",
  "290": "PagBank",
  "293": "Lastro",
  "296": "Vision",
  "298": "Vip's",
  "299": "Sorocred",
  "300": "Banco de La Nación Argentina",
  "301": "BPP",
  "306": "Portal de Negócios",
  "318": "Banco BMG",
  "320": "China Construction Bank",
  "323": "Mercado Pago",
  "324": "Cartos",
  "325": "Órama",
  "326": "Parati",
  "329": "QI Sociedade de Crédito",
  "330": "Banco Bari",
  "331": "Fram Capital",
  "332": "Acesso Soluções",
  "335": "Banco Digio",
  "336": "C6 Bank",
  "340": "Superdigital",
  "341": "Itaú Unibanco",
  "342": "Creditas",
  "343": "FFA",
  "348": "Banco XP",
  "349": "AMAGGI",
  "352": "Toro Investimentos",
  "354": "Necton",
  "355": "Ótimo",
  "364": "Gerencianet",
  "366": "Banco Société Générale",
  "370": "Banco Mizuho",
  "373": "UP.P",
  "376": "Banco J.P. Morgan",
  "389": "Mercantil do Brasil",
  "394": "Bradesco Financiamentos",
  "399": "HSBC Brasil",
  "412": "Banco Capital",
  "422": "Safra",
  "456": "Banco MUFG",
  "464": "Banco Sumitomo Mitsui",
  "473": "Banco Caixa Geral",
  "477": "Citibank",
  "479": "Banco ItauBank",
  "487": "Deutsche Bank",
  "488": "JPMorgan",
  "492": "ING",
  "495": "Banco La Provincia",
  "505": "Credit Suisse Hedging-Griffo",
  "545": "Senso Corretora",
  "600": "Banco Luso Brasileiro",
  "604": "Banco Industrial",
  "610": "Banco VR",
  "611": "Banco Paulista",
  "612": "Banco Guanabara",
  "613": "Omni",
  "623": "Banco PAN",
  "626": "Banco Ficsa",
  "630": "Banco Smartbank",
  "633": "Banco Rendimento",
  "634": "Banco Triângulo",
  "637": "Sofisa Direto",
  "643": "Banco Pine",
  "652": "Itaú Unibanco",
  "653": "Banco Indusval",
  "654": "Banco A.J. Renner",
  "655": "Banco Votorantim",
  "707": "Banco Daycoval",
  "712": "Banco Ourinvest",
  "735": "Banco Neon",
  "739": "Banco Cetelem",
  "741": "Banco Ribeirão Preto",
  "743": "Banco Semear",
  "745": "Citibank",
  "746": "Banco Modal",
  "747": "Banco Rabobank",
  "748": "Sicredi",
  "751": "Scotiabank",
  "752": "BNP Paribas",
  "756": "Sicoob",
  "757": "Banco Keb Hana",
};

  setDadosBancarios({
  ...json.restaurante,
  banco:
    bancos[json.restaurante.banco] ??
    json.restaurante.banco,
});

}


  const dinheiro = (v: number) =>
    v.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  const badge = (status: string) => {
    switch (status) {
      case "Pago":
        return (
          <span className="rounded-full bg-green-100 text-green-700 px-3 py-1 text-xs font-semibold">
            Pago
          </span>
        );

      case "Em processamento":
        return (
          <span className="rounded-full bg-blue-100 text-blue-700 px-3 py-1 text-xs font-semibold">
            Em processamento
          </span>
        );

      default:
        return (
          <span className="rounded-full bg-gray-100 text-gray-600 px-3 py-1 text-xs font-semibold">
            Cancelado
          </span>
        );
    }
  };

async function solicitarSaque() {

  if (valorNumerico < 1) {
    alert("O valor mínimo para saque é R$ 1,00.");
    return;
  }

  if (valorNumerico > saldoDisponivel) {
    alert("Saldo insuficiente para realizar o saque.");
    return;
  }

  try {

if (!restauranteId) {
  window.location.href = "/login";
  return;
}

    const response = await fetch(
      "/api/pagarme/saque",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          restauranteId,
          valor: valorNumerico,
        }),
      }
    );

    const json = await response.json();

    console.log(json);

    if (!json.success) {
      alert(
        json.error?.message ??
        "Erro ao solicitar saque."
      );
      return;
    }

alert("Saque solicitado com sucesso!");

await carregarSaldo();
await carregarHistorico();

setValor(
  saldoDisponivel
    .toFixed(2)
    .replace(".", ",")
);

  } catch (err) {

    console.error(err);

    alert("Erro ao solicitar saque.");

  }

}

  return (
    <div className="space-y-6">

      <div className="flex items-start justify-between">

        <div>

          <h1 className="text-4xl font-bold">
            Saques
          </h1>

          <p className="text-gray-500 mt-2">
            Gerencie seus saques e acompanhe seu saldo disponível.
          </p>

        </div>

        <Button
          variant="outline"
          className="h-12 border-[#6D1F2F] text-[#6D1F2F]"
        >
          <Settings className="w-4 h-4 mr-2" />
          Configurações de Saques
        </Button>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">

        <Card className="shadow-sm">

          <CardContent className="p-6">

            <div className="flex items-center justify-between">

              <span className="font-semibold">
                Saldo Total
              </span>

              <Info className="w-4 h-4 text-gray-400"/>

            </div>

            <div className="mt-6 w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">

              <Wallet className="text-[#6D1F2F]" size={28}/>

            </div>

            <h2 className="text-4xl font-bold mt-6">
              {dinheiro(saldoTotal)}
            </h2>

            <p className="text-gray-500 mt-2">
              Total de vendas via Pix
            </p>

          </CardContent>

        </Card>

        <Card className="shadow-sm">

          <CardContent className="p-6">

            <div className="flex justify-between">

              <span className="font-semibold">
                Disponível para saque
              </span>

              <Info className="w-4 h-4 text-gray-400"/>

            </div>

            <div className="mt-6 w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">

              <DollarSign
                size={28}
                className="text-green-600"
              />

            </div>

            <h2 className="text-4xl font-bold mt-6">
              {dinheiro(saldoDisponivel)}
            </h2>

            <p className="text-gray-500 mt-2">
              Valor pronto para você sacar
            </p>

          </CardContent>

        </Card>

        <Card className="shadow-sm">

          <CardContent className="p-6">

            <div className="flex justify-between">

              <span className="font-semibold">
                Em processamento
              </span>

              <Info className="w-4 h-4 text-gray-400"/>

            </div>

            <div className="mt-6 w-14 h-14 rounded-full bg-yellow-100 flex items-center justify-center">

              <Clock3
                size={28}
                className="text-yellow-600"
              />

            </div>

            <h2 className="text-4xl font-bold mt-6">
              {dinheiro(saldoProcessando)}
            </h2>

            <p className="text-gray-500 mt-2">
              Aguardando liberação
            </p>

          </CardContent>

        </Card>

        <Card className="shadow-sm">

          <CardContent className="p-6">

            <div className="flex justify-between">

              <span className="font-semibold">
                Taxa por saque
              </span>

              <Info className="w-4 h-4 text-gray-400"/>

            </div>

            <div className="mt-6 w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center">

              <Percent
                size={28}
                className="text-purple-600"
              />

            </div>

            <h2 className="text-4xl font-bold">
              {dinheiro(TAXA_SAQUE)}
            </h2>

            <p className="text-gray-500 mt-2">
              Taxa fixa por saque realizado
            </p>

          </CardContent>

        </Card>

      </div>
      
                <Card className="border-green-200 bg-green-50/50 shadow-sm">
        <CardContent className="flex items-center justify-between p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>

            <div>
              <p className="font-semibold text-gray-800">
                O valor cai na sua conta cadastrada em até 1 dia útil após a
                aprovação do saque.
              </p>

              <p className="text-sm text-gray-500 mt-1">
                Todas as transferências são realizadas via Pix pela Pagar.me.
              </p>
            </div>
          </div>

          <Landmark className="w-10 h-10 text-green-600 hidden lg:block" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        <Card className="xl:col-span-2 shadow-sm">

          <CardContent className="p-8">

            <h2 className="text-3xl font-bold">
              Solicitar um saque
            </h2>

            <p className="text-gray-500 mt-5">
              Saldo disponível para saque
            </p>

            <p className="text-5xl font-bold text-green-600 mt-2">
              {dinheiro(saldoDisponivel)}
            </p>

            <div className="mt-8">

              <label className="font-medium">
                Valor do saque
              </label>

              <div className="flex gap-4 mt-3">

                <div className="flex flex-1">

                  <div className="w-14 border rounded-l-lg flex items-center justify-center bg-gray-50">
                    R$
                  </div>

                  <Input
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    className="rounded-l-none h-12"
                  />

                </div>

                <Button
                  variant="outline"
                  className="border-[#6D1F2F] text-[#6D1F2F] h-12 px-8"
                  onClick={() =>
                    setValor(
                      saldoDisponivel
                        .toFixed(2)
                        .replace(".", ",")
                    )
                  }
                >
                  Usar saldo total
                </Button>

              </div>

            </div>

            <Card className="mt-8 border">

              <CardContent className="p-6 space-y-5">

                <div className="flex justify-between">

                  <span>
                    Valor solicitado
                  </span>

                  <span className="font-semibold">
                    {dinheiro(valorNumerico)}
                  </span>

                </div>

                <div className="flex justify-between">

                  <span>
                    Taxa do saque
                  </span>

                  <span className="font-semibold text-red-500">
                    - {dinheiro(TAXA_SAQUE)}
                  </span>

                </div>

                <div className="border-t pt-5 flex justify-between">

                  <span className="text-xl font-bold">
                    Você receberá
                  </span>

                  <span className="text-3xl font-bold text-green-600">
                    {dinheiro(liquido)}
                  </span>

                </div>

              </CardContent>

            </Card>

            <Card className="mt-8 bg-blue-50 border-blue-200">

              <CardContent className="p-5">

                <div className="flex gap-4">

                  <Info className="w-6 h-6 text-blue-600 mt-1"/>

                  <div>

                    <p className="text-gray-700">
                      O valor será transferido para sua conta bancária cadastrada
                      em até 1 dia útil após a aprovação do saque.
                    </p>

                    <div className="mt-6">

                      <p className="font-semibold">
                        Conta de destino:
                      </p>

<p className="text-gray-600 mt-1">

  {dadosBancarios
    ? `${dadosBancarios.banco} | Agência ${dadosBancarios.agencia} | Conta ${dadosBancarios.conta} | ${
        dadosBancarios.tipo_conta === "poupanca"
          ? "Conta Poupança"
          : "Conta Corrente"
      }`
    : "Carregando dados bancários..."}

</p>

                    </div>

                  </div>

                </div>

              </CardContent>

            </Card>

<Button
  className="w-full mt-8 h-14 text-lg bg-[#6D1F2F] hover:bg-[#531723]"
  onClick={solicitarSaque}
>

  <Send className="mr-2 w-5 h-5" />

  Efetuar saque

</Button>

          </CardContent>

        </Card>

        <div className="space-y-6">

          <Card className="shadow-sm">

            <CardContent className="p-8">

              <h2 className="text-3xl font-bold mb-8">
                Como funciona
              </h2>

              <div className="space-y-8">

                <div className="flex gap-5">

                  <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">

                    <Wallet className="text-[#6D1F2F]" />

                  </div>

                  <div>

                    <h3 className="font-bold">
                      1. Solicite seu saque
                    </h3>

                    <p className="text-gray-500 mt-2">
                      Informe o valor que deseja sacar e confirme a solicitação.
                    </p>

                  </div>

                </div>

                <div className="flex gap-5">

                  <div className="w-14 h-14 rounded-full bg-yellow-100 flex items-center justify-center">

                    <Clock3 className="text-yellow-600"/>

                  </div>

                  <div>

                    <h3 className="font-bold">
                      2. Aguardamos aprovação
                    </h3>

                    <p className="text-gray-500 mt-2">
                      Seu saque será processado automaticamente.
                    </p>

                  </div>

                </div>

                <div className="flex gap-5">

                  <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">

                    <Send className="text-green-600"/>

                  </div>

                  <div>

                    <h3 className="font-bold">
                      3. Transferência via Pix
                    </h3>

                    <p className="text-gray-500 mt-2">
                      O valor será enviado para sua conta cadastrada.
                    </p>

                  </div>

                </div>

                <div className="flex gap-5">

                  <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center">

                    <CheckCircle2 className="text-purple-600"/>

                  </div>

                  <div>

                    <h3 className="font-bold">
                      4. Disponível em até 1 dia útil
                    </h3>

                    <p className="text-gray-500 mt-2">
                      O dinheiro cai automaticamente na sua conta.
                    </p>

                  </div>

                </div>

              </div>

            </CardContent>

          </Card>

                    <Card className="shadow-sm">

            <CardContent className="p-8">

              <div className="flex gap-4">

                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">

                  <ShieldCheck className="text-green-600"/>

                </div>

                <div>

                  <h3 className="text-xl font-bold">
                    Segurança garantida
                  </h3>

                  <p className="text-gray-500 mt-2 leading-7">
                    Seus dados e transações são protegidos pela Pagar.me,
                    uma instituição autorizada pelo Banco Central.
                  </p>

                  <div className="mt-0">


                  </div>

                </div>

              </div>

            </CardContent>

          </Card>

        </div>

      </div>

      <Card className="shadow-sm">

        <CardContent className="p-8">

          <div className="flex items-center justify-between mb-8">

            <h2 className="text-3xl font-bold">
              Histórico de saques
            </h2>

            <Button
              variant="outline"
              className="gap-2"
            >
              <Filter className="w-4 h-4"/>

              Todos os status

            </Button>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead>

                <tr className="border-b">

                  <th className="text-left py-4 font-semibold">
                    Data da solicitação
                  </th>

                  <th className="text-left py-4 font-semibold">
                    Valor solicitado
                  </th>

                  <th className="text-left py-4 font-semibold">
                    Taxa
                  </th>

                  <th className="text-left py-4 font-semibold">
                    Você recebeu
                  </th>

                  <th className="text-left py-4 font-semibold">
                    Status
                  </th>

                  <th className="text-left py-4 font-semibold">
                    Previsão / Data
                  </th>

                </tr>

              </thead>

<tbody>

  {historico.length === 0 ? (

    <tr>
      <td
        colSpan={6}
        className="text-center py-10 text-gray-500"
      >
        Nenhum saque realizado.
      </td>
    </tr>

  ) : (

    historico.map((item) => (

                  <tr
                    key={item.id}
                    className="border-b last:border-0"
                  >

                    <td className="py-5">
                      {new Date(item.created_at).toLocaleString("pt-BR")}
                    </td>

                    <td>
                      {dinheiro(item.valor)}
                    </td>

                    <td>
                      {dinheiro(item.taxa)}
                    </td>

                    <td>
                      {dinheiro(item.valor_liquido)}
                    </td>

                    <td>
                      {badge(item.status)}
                    </td>

                    <td>
                      {item.pago_em
  ? new Date(item.pago_em).toLocaleDateString("pt-BR")
  : "-"}
                    </td>

                  </tr>

                ))

              )}

              </tbody>

            </table>

          </div>

          <div className="flex justify-center mt-10">

            <Button
              variant="ghost"
              className="text-[#6D1F2F] hover:text-[#531723]"
            >

              Ver mais saques

            </Button>

          </div>

        </CardContent>

      </Card>

    </div>
  );
}