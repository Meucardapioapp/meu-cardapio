import type { Metadata } from "next";
import PaginaLegal from "../components/legal/PaginaLegal";
import { DIAS_TESTE_GRATIS, PLANOS, TAXA_PIX_ONLINE_TEXTO, formatarReais } from "@/lib/planos";
import { EMPRESA, TERMOS_VERSAO } from "@/lib/legal";

export const metadata: Metadata = { title: "Termos de Uso | MeuCardápioApp" };

const dataVersao = TERMOS_VERSAO.split("-").reverse().join("/");

export default function TermosPage() {
  const identificacao = [EMPRESA.razaoSocial || EMPRESA.nome, EMPRESA.cnpj && `CNPJ ${EMPRESA.cnpj}`, EMPRESA.endereco]
    .filter(Boolean)
    .join(", ");

  return (
    <PaginaLegal titulo="Termos de Uso" atualizadoEm={dataVersao}>
      <p>
        Estes termos valem entre {identificacao} (o &quot;MeuCardápioApp&quot;) e os restaurantes que usam o sistema
        para ter cardápio digital, receber pedidos e organizar o atendimento. Ao criar a conta ou continuar usando o
        painel depois de uma atualização, você concorda com eles. Quem cria a conta precisa ter 18 anos ou mais e poder
        representar o restaurante.
      </p>

      <h2>1. O que o sistema faz</h2>
      <p>
        Cardápio digital com link próprio, pedidos de delivery, retirada e mesa (inclusive por QR Code), painel de
        gestão, área do salão (comandas, garçons, cozinha e motoboys pelo celular), cupons, fidelidade, relatórios e Pix
        online opcional. O restaurante é o único responsável pelos produtos, preços, fotos e textos do cardápio,
        entregas, atendimento, emissão de nota fiscal e pelo cumprimento das leis do seu negócio (inclusive o Código
        de Defesa do Consumidor e as normas sanitárias e fiscais). A conta impressa pelo sistema não é documento fiscal.
      </p>

      <h2>2. Teste grátis e plano</h2>
      <ul>
        <li>Toda conta nova tem {DIAS_TESTE_GRATIS} dias de teste grátis, sem cartão.</li>
        <li>Depois do teste, o uso exige o {PLANOS.mensal.nome}, de {formatarReais(PLANOS.mensal.preco)} por mês.</li>
        <li>
          No cartão de crédito a cobrança é automática todo mês, até você cancelar (em Minha conta, a qualquer
          momento). No Pix, você paga um mês por vez.
        </li>
        <li>Não há taxa por pedido. No Pix online automático há {TAXA_PIX_ONLINE_TEXTO.toLowerCase()}.</li>
        <li>O preço pode mudar com aviso de pelo menos 30 dias, valendo a partir da renovação seguinte.</li>
      </ul>

      <h2>3. Cancelamento e reembolso</h2>
      <p>
        Você pode cancelar a qualquer momento em Minha conta → Cancelar plano. A cobrança automática é encerrada na
        hora, não há multa e o acesso continua até o fim do período já pago. Valores de períodos já iniciados não são
        devolvidos, salvo o que a lei exigir.
      </p>

      <h2>4. Plano vencido e encerramento da conta</h2>
      <p>
        Sem pagamento, o cardápio fica fora do ar, os pedidos online são bloqueados e o painel é travado. Os dados
        ficam guardados e tudo volta quando o pagamento é confirmado. Contas sem plano por mais de 12 meses podem ser
        apagadas, com aviso prévio. Ao encerrar a conta, você pode pedir uma cópia dos seus dados (produtos, pedidos e
        clientes) em até 30 dias; depois disso eles são apagados ou anonimizados, salvo o que a lei obrigar a guardar.
      </p>

      <h2>5. Acessos, senhas e equipe</h2>
      <ul>
        <li>Guarde em segredo a senha do painel. Atendentes do painel têm login próprio.</li>
        <li>
          Garçons, cozinha e motoboys entram pelo celular com um PIN criado por você. Envie o PIN só para a própria
          pessoa, bloqueie ou gere um PIN novo quando alguém sair da equipe e não compartilhe acessos.
        </li>
        <li>Você responde pelo que for feito com os acessos do seu restaurante e deve nos avisar se suspeitar de uso indevido.</li>
      </ul>

      <h2>6. Uso correto</h2>
      <ul>
        <li>Não vender produtos proibidos, não enganar clientes e não publicar conteúdo de terceiros sem autorização (fotos, marcas, textos).</li>
        <li>Não enviar mensagens em massa ou de propaganda sem o consentimento do cliente.</li>
        <li>Manter informações verdadeiras no cardápio (preços, fotos, horários e avaliações) e não manipular avaliações.</li>
        <li>Não tentar acessar dados de outros restaurantes, burlar limites ou atacar o sistema.</li>
      </ul>
      <p>O descumprimento, ou risco à segurança do sistema, pode levar à suspensão da conta.</p>

      <h2>7. Taxa de serviço (10%)</h2>
      <p>
        A taxa de serviço do salão é opcional para o cliente (Lei 13.419/2017). O restaurante decide se oferece, deve
        informar o cliente e é responsável pelo repasse aos funcionários e pelos encargos.
      </p>

      <h2>8. Pix online e saques</h2>
      <p>
        O Pix online é processado pela Pagar.me, que repassa o valor para a conta bancária cadastrada pelo
        restaurante. Prazos de liberação e saques seguem as regras da Pagar.me. O Pix na chave do próprio restaurante
        cai direto na conta dele, sem passar pelo MeuCardápioApp.
      </p>

      <h2>9. Proteção de dados (LGPD)</h2>
      <ul>
        <li>
          Sobre os dados dos <strong>clientes que fazem pedidos</strong> e da <strong>sua equipe</strong>, o restaurante é o
          <em> controlador</em> e o MeuCardápioApp é o <em>operador</em>: tratamos esses dados só para prestar o serviço
          e seguindo as suas instruções, nunca para vender ou usar em outro restaurante.
        </li>
        <li>
          O restaurante se compromete a usar esses dados só para atender os pedidos e operar o negócio, informar seus
          clientes e funcionários sobre o tratamento, atender os pedidos deles (acesso, correção, exclusão) e só
          ativar o Pixel do Meta ou mensagens de propaganda com base legal adequada.
        </li>
        <li>
          Usamos fornecedores (suboperadores) como hospedagem, banco de dados, pagamentos e mensagens, listados na{" "}
          <a className="underline" href="/privacidade">Política de Privacidade</a>, com obrigações de segurança.
        </li>
        <li>
          Se houver um incidente de segurança que afete dados do seu restaurante, avisaremos sem demora injustificada,
          com o que soubermos, para que você possa cumprir as suas obrigações.
        </li>
        <li>Ao fim do contrato, os dados seguem o item 4.</li>
      </ul>

      <h2>10. Disponibilidade e responsabilidade</h2>
      <p>
        Trabalhamos para manter o sistema no ar o tempo todo, mas podem ocorrer interrupções para manutenção ou por
        falhas de terceiros (internet, hospedagem, meios de pagamento, WhatsApp). Não respondemos por lucros
        cessantes nem por danos causados por uso indevido dos acessos do restaurante. Nossa responsabilidade total fica
        limitada ao valor pago pelo plano nos últimos 3 meses, salvo nos casos em que a lei não permita limitar.
      </p>

      <h2>11. Para quem faz pedidos nos cardápios</h2>
      <p>
        O pedido é feito ao restaurante, que é o responsável pelos produtos, preços, entrega, troca e atendimento. O
        MeuCardápioApp fornece a tecnologia. Dúvidas sobre o pedido devem ser tratadas com o restaurante.
      </p>

      <h2>12. Mudanças nestes termos</h2>
      <p>
        Avisaremos no painel antes de qualquer mudança importante, e você confirma a nova versão para continuar. Se
        não concordar, pode cancelar o plano sem multa.
      </p>

      <h2>13. Lei e foro</h2>
      <p>
        Estes termos seguem as leis do Brasil. Fica eleito o foro {EMPRESA.cidadeForo ? `da comarca de ${EMPRESA.cidadeForo}` : "do domicílio do restaurante contratante"} para resolver
        qualquer questão, salvo regra legal diferente.
      </p>
    </PaginaLegal>
  );
}
