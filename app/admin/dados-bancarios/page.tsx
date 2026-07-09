"use client";

import { useEffect, useState } from "react";

export default function DadosBancariosPage() {
  const [restauranteId, setRestauranteId] =
    useState("");

  const [cpfCnpj, setCpfCnpj] =
    useState("");

  const [banco, setBanco] =
    useState("");

    const [buscaBanco, setBuscaBanco] = useState("");

    const [mostrarBancos, setMostrarBancos] =
  useState(false);

  const [agencia, setAgencia] =
    useState("");

  const [conta, setConta] =
    useState("");

  const [tipoConta, setTipoConta] =
    useState("corrente");

  const [loading, setLoading] =
    useState(false);

    function formatarCpfCnpj(valor: string) {
  const numeros = valor.replace(/\D/g, "");

  if (numeros.length <= 11) {
    return numeros
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }

  return numeros
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

  useEffect(() => {
    const id =
      localStorage.getItem(
        "restaurante_id"
      ) || "";

    setRestauranteId(id);
  }, []);

  useEffect(() => {
  if (!restauranteId) return;

  carregarDados();
}, [restauranteId]);

async function carregarDados() {
  try {
    const response = await fetch(
      `/api/restaurante?id=${restauranteId}`
    );

    const resultado = await response.json();

    if (!resultado.success) return;

    const restaurante = resultado.restaurante;

    setCpfCnpj(restaurante.cpf_cnpj || "");
    setBanco(restaurante.banco || "");
    setAgencia(restaurante.agencia || "");
    setConta(restaurante.conta || "");
    setTipoConta(restaurante.tipo_conta || "corrente");

    if (restaurante.banco) {
      const bancoEncontrado = bancos.find(
        (b) => b.codigo === restaurante.banco
      );

      if (bancoEncontrado) {
        setBuscaBanco(bancoEncontrado.nome);
      }
    }
  } catch (error) {
    console.log(error);
  }
}

  async function salvarDados() {
    try {
      setLoading(true);

const documentoLimpo =
  cpfCnpj.replace(/\D/g, "");

if (
  documentoLimpo.length !== 11 &&
  documentoLimpo.length !== 14
) {
  alert(
    "Informe um CPF ou CNPJ válido"
  );
  setLoading(false);
  return;
}

      const response =
        await fetch(
          "/api/pagarme/criar-recebedor",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              restauranteId,
              cpfCnpj,
              banco,
              agencia,
              conta,
              tipoConta,
            }),
          }
        );

      const resultado =
        await response.json();

      if (!resultado.success) {
        alert(
          resultado.error ||
            "Erro ao salvar"
        );
        return;
      }

      alert(
        "Dados bancários salvos com sucesso!"
      );

    } catch (error) {
      console.log(error);

      alert(
        "Erro ao salvar dados"
      );
    } finally {
      setLoading(false);
    }
  }

  const bancos = [
  { codigo: "001", nome: "Banco do Brasil" },
  { codigo: "003", nome: "Banco da Amazônia" },
  { codigo: "021", nome: "Banestes" },
  { codigo: "033", nome: "Santander" },
  { codigo: "041", nome: "Banrisul" },
  { codigo: "047", nome: "Banese" },
  { codigo: "069", nome: "Crefisa" },
  { codigo: "070", nome: "BRB" },
  { codigo: "077", nome: "Banco Inter" },
  { codigo: "082", nome: "Banco Topázio" },
  { codigo: "085", nome: "Ailos" },
  { codigo: "104", nome: "Caixa Econômica Federal" },
  { codigo: "121", nome: "Agibank" },
  { codigo: "149", nome: "Facta Financeira" },
  { codigo: "197", nome: "Stone" },
  { codigo: "208", nome: "BTG Pactual" },
  { codigo: "212", nome: "Banco Original" },
  { codigo: "237", nome: "Bradesco" },
  { codigo: "246", nome: "ABC Brasil" },
  { codigo: "260", nome: "Nubank" },
  { codigo: "274", nome: "Money Plus" },
  { codigo: "290", nome: "PagBank" },
  { codigo: "318", nome: "BMG" },
  { codigo: "323", nome: "Mercado Pago" },
  { codigo: "332", nome: "Acesso Bank" },
  { codigo: "336", nome: "C6 Bank" },
  { codigo: "341", nome: "Itaú" },
  { codigo: "348", nome: "XP Investimentos" },
  { codigo: "364", nome: "Efí Bank" },
  { codigo: "380", nome: "PicPay Bank" },
  { codigo: "389", nome: "Banco Mercantil" },
  { codigo: "399", nome: "HSBC" },
  { codigo: "403", nome: "Cora" },
  { codigo: "422", nome: "Safra" },
  { codigo: "461", nome: "Asaas" },
  { codigo: "509", nome: "Creditas" },
  { codigo: "536", nome: "Banco J.Safra" },
  { codigo: "604", nome: "Banco Industrial" },
  { codigo: "612", nome: "Banco Guanabara" },
  { codigo: "623", nome: "Banco PAN" },
  { codigo: "633", nome: "Banco Rendimento" },
  { codigo: "637", nome: "Sofisa Direto" },
  { codigo: "654", nome: "Banco Digimais" },
  { codigo: "655", nome: "Banco Votorantim" },
  { codigo: "707", nome: "Banco Daycoval" },
  { codigo: "735", nome: "Neon" },
  { codigo: "743", nome: "Banco Semear" },
  { codigo: "746", nome: "Modal" },
  { codigo: "748", nome: "Sicredi" },
  { codigo: "756", nome: "Sicoob" },
];

  return (
    <div className="max-w-3xl">
      <h1 className="text-4xl font-black">
        Dados Bancários
      </h1>

      <p className="mt-2 text-zinc-500">
        Configure a conta onde deseja
        receber suas vendas.
      </p>

      <div
        className="
          mt-8
          rounded-3xl
          border
          bg-white
          p-6
          shadow-sm
        "
      >
        <div className="space-y-4">

          <div>
            <label
              className="
                mb-2
                block
                font-medium
              "
            >
              CPF ou CNPJ
            </label>

            <input
              type="text"
              value={cpfCnpj}
              onChange={(e) =>
  setCpfCnpj(
    formatarCpfCnpj(
      e.target.value
    )
  )
}
              placeholder="Digite seu CPF ou CNPJ"
              className="
                w-full
                rounded-xl
                border
                p-4
                outline-none
              "
            />
          </div>

          <div>
            <label
              className="
                mb-2
                block
                font-medium
              "
            >
              Banco
            </label>

  
<div>
  <input
    type="text"
    placeholder="🔍 Buscar banco..."
    value={buscaBanco}
    onChange={(e) =>
      setBuscaBanco(e.target.value)
    }

    onFocus={() => setMostrarBancos(true)}

    className="
      w-full
      rounded-xl
      border
      p-4
      outline-none
      mb-3
    "
  />

 {mostrarBancos && (
  <div
    className="
      border
      rounded-xl
      max-h-64
      overflow-y-auto
      bg-white
      shadow-lg
    "
  >

    {bancos
      .filter((b) =>
        b.nome
          .toLowerCase()
          .includes(
            buscaBanco.toLowerCase()
          )
      )
      .map((b) => (
        <button
          key={b.codigo}
          type="button"
       onClick={() => {
  setBanco(b.codigo);
  setBuscaBanco(b.nome);
  setMostrarBancos(false);
}}   
          className={`
  w-full
  text-left
  px-4
  py-3
  border-b
  hover:bg-gray-100
  ${
    banco === b.codigo
      ? "bg-[#F8F1F3] text-[#6D1F2F] font-semibold"
      : ""
  }
`}
        >
          {b.nome}
        </button>
      ))}

  </div>
)}

</div>

          </div>

          <div>
            <label
              className="
                mb-2
                block
                font-medium
              "
            >
              Agência
            </label>

            <input
              type="text"
              value={agencia}
              onChange={(e) =>
                setAgencia(
                  e.target.value
                )
              }
              placeholder="Digite a agência"
              className="
                w-full
                rounded-xl
                border
                p-4
                outline-none
              "
            />
          </div>

          <div>
            <label
              className="
                mb-2
                block
                font-medium
              "
            >
              Conta
            </label>

            <input
              type="text"
              value={conta}
              onChange={(e) =>
                setConta(
                  e.target.value
                )
              }
              placeholder="Digite a conta"
              className="
                w-full
                rounded-xl
                border
                p-4
                outline-none
              "
            />
          </div>

          <div>
            <label
              className="
                mb-2
                block
                font-medium
              "
            >
              Tipo da Conta
            </label>

            <select
              value={tipoConta}
              onChange={(e) =>
                setTipoConta(
                  e.target.value
                )
              }
              className="
                w-full
                rounded-xl
                border
                p-4
              "
            >
              <option value="corrente">
                Conta Corrente
              </option>

              <option value="poupanca">
                Conta Poupança
              </option>
            </select>
          </div>

          <button
            onClick={salvarDados}
            disabled={loading}
            className="
              mt-4
              rounded-xl
              bg-[#6D1F2F]
              px-6
              py-4
              font-bold
              text-white
              disabled:opacity-50
            "
          >
            {loading
              ? "Salvando..."
              : "Salvar Dados Bancários"}
          </button>

        </div>
      </div>
    </div>
  );
}