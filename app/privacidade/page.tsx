import type { Metadata } from "next";
import PaginaLegal from "../components/legal/PaginaLegal";
import { EMPRESA, TERMOS_VERSAO } from "@/lib/legal";

export const metadata: Metadata = { title: "Política de Privacidade | MeuCardápioApp" };

const dataVersao = TERMOS_VERSAO.split("-").reverse().join("/");
const LINK_SUPORTE = `https://wa.me/${EMPRESA.whatsappSuporte}`;

export default function PrivacidadePage() {
  const identificacao = [EMPRESA.razaoSocial || EMPRESA.nome, EMPRESA.cnpj && `CNPJ ${EMPRESA.cnpj}`, EMPRESA.endereco]
    .filter(Boolean)
    .join(", ");

  return (
    <PaginaLegal titulo="Política de Privacidade" atualizadoEm={dataVersao}>
      <p>
        Esta política explica, em linguagem simples, quais dados pessoais o MeuCardápioApp trata, para quê, com quem
        compartilha, por quanto tempo guarda e como você exerce seus direitos, conforme a Lei Geral de Proteção de
        Dados (LGPD, Lei 13.709/2018).
      </p>

      <h2>1. Quem somos e como falar com a gente</h2>
      <p>
        O serviço é oferecido por {identificacao}. Para qualquer assunto de privacidade, inclusive falar com o nosso
        encarregado pelo tratamento de dados (LGPD, art. 41), use{" "}
        {EMPRESA.emailPrivacidade ? (
          <>
            o e-mail <a className="underline" href={`mailto:${EMPRESA.emailPrivacidade}`}>{EMPRESA.emailPrivacidade}</a> ou{" "}
          </>
        ) : null}
        o <a className="underline" href={LINK_SUPORTE} target="_blank" rel="noreferrer">WhatsApp do suporte</a>.
      </p>

      <h2>2. Quem decide sobre cada dado</h2>
      <ul>
        <li>
          <strong>Dados dos restaurantes (donos e responsáveis):</strong> o MeuCardápioApp é o <em>controlador</em>.
        </li>
        <li>
          <strong>Dados dos clientes que fazem pedidos e da equipe do restaurante</strong> (garçons, cozinha,
          motoboys, atendentes): o <em>restaurante</em> é o controlador, e o MeuCardápioApp é o <em>operador</em> —
          tratamos esses dados só para prestar o serviço ao restaurante e conforme as instruções dele. Pedidos sobre
          esses dados podem ser feitos ao restaurante ou a nós.
        </li>
      </ul>

      <h2>3. Quais dados, para quê e com qual base legal</h2>
      <p><strong>Restaurantes</strong></p>
      <ul>
        <li>Nome, e-mail, WhatsApp, cidade e endereço do restaurante: criar e manter a conta, suporte e avisos do plano (execução de contrato).</li>
        <li>Pagamento do plano: o cartão é digitado direto no ambiente da Pagar.me; não vemos nem guardamos o número (execução de contrato).</li>
        <li>CPF/CNPJ e conta bancária, só para quem ativa o Pix online: repasse dos valores pela Pagar.me. Ficam criptografados (execução de contrato e obrigação legal).</li>
        <li>Motivo e sugestões ao cancelar o plano: melhorar o serviço (legítimo interesse).</li>
        <li>Registros de login (endereço IP, data e hora), guardados pelo sistema de login: segurança da conta e cumprimento do Marco Civil da Internet (obrigação legal).</li>
      </ul>
      <p><strong>Clientes que fazem pedidos</strong></p>
      <ul>
        <li>Nome, telefone, endereço de entrega, itens e observações do pedido: para o restaurante preparar, cobrar e entregar (execução do contrato de compra).</li>
        <li>O endereço é enviado a um serviço de mapas para calcular a distância e a taxa de entrega, quando o restaurante cobra por quilômetro.</li>
        <li>CPF: só para gerar o Pix online (exigência do sistema de pagamento). Se você salvar o CPF no seu perfil, ele fica criptografado. Se marcar “Lembrar meu CPF neste celular”, ele fica guardado só no seu aparelho.</li>
        <li>Histórico de pedidos e selos de fidelidade: programa de fidelidade e cupons do restaurante (execução de contrato / legítimo interesse).</li>
        <li>Avaliação do pedido: a nota, o comentário e o seu primeiro nome podem aparecer publicamente no cardápio.</li>
        <li>Quando o restaurante ativa, você recebe mensagens no WhatsApp sobre o andamento do pedido.</li>
        <li>No atendimento em mesa, o pedido fica ligado ao número da mesa; o nome é opcional.</li>
        <li>Para entregas, o motoboy designado vê nome, telefone, endereço e forma de pagamento só dos pedidos que leva.</li>
      </ul>
      <p><strong>Equipe do restaurante</strong></p>
      <ul>
        <li>Nome e celular de garçons, cozinha, motoboys e atendentes, e o PIN de acesso (guardado embaralhado): login no app da equipe.</li>
        <li>Registros de trabalho (mesas atendidas, pedidos lançados, itens preparados, entregas e taxa de serviço): relatórios do restaurante.</li>
      </ul>

      <h2>4. Com quem compartilhamos</h2>
      <p>Não vendemos dados. Usamos fornecedores que tratam dados só para prestar o serviço para nós:</p>
      <ul>
        <li><strong>Supabase</strong> (banco de dados, login e fotos) e <strong>Vercel</strong> (hospedagem do site).</li>
        <li><strong>Pagar.me</strong> (pagamentos por Pix e cartão, cobrança do plano e repasses).</li>
        <li><strong>Meta</strong>: WhatsApp (mensagens de pedido, quando ativado) e Pixel do Meta (só se o restaurante ativar e você aceitar os cookies de marketing).</li>
        <li><strong>Resend</strong> (e-mails do sistema), <strong>Cloudflare</strong> (verificação anti-robô no cadastro e login).</li>
        <li><strong>OpenStreetMap / ViaCEP</strong> (busca de endereço por CEP, mapa e cálculo de distância).</li>
        <li>Serviços de notificação do próprio navegador ou celular (Google, Apple, Mozilla), quando você ativa os avisos do painel.</li>
        <li>Autoridades, quando a lei ou uma ordem judicial exigir.</li>
      </ul>
      <p>
        Alguns desses fornecedores podem guardar dados em servidores fora do Brasil. Nesses casos a transferência
        segue o art. 33 da LGPD, com contratos e padrões de segurança desses fornecedores.
      </p>

      <h2>5. Armazenamento no aparelho e cookies</h2>
      <ul>
        <li>
          <strong>Essenciais</strong> (não precisam de autorização): sessão de login do painel e da equipe, carrinho,
          endereço e código de acesso da sua conta no cardápio, preferências da tela.
        </li>
        <li>
          <strong>Marketing</strong> (Pixel do Meta): só funcionam se o restaurante ativar <em>e</em> você tocar em
          “Aceitar”. Você pode mudar a escolha a qualquer momento em “Cookies”, no rodapé do cardápio.
        </li>
      </ul>

      <h2>6. Por quanto tempo guardamos</h2>
      <ul>
        <li>Conta do restaurante: enquanto estiver ativa. Conta sem plano por mais de 12 meses pode ser apagada, com aviso.</li>
        <li>Pagamentos e notas do plano: 5 anos (obrigações fiscais e contábeis).</li>
        <li>Registros de login: pelo menos 6 meses (Marco Civil da Internet).</li>
        <li>Dados dos clientes e da equipe: enquanto o restaurante usar o sistema, ou até o cliente pedir para apagar. Pedidos podem ser mantidos sem dados pessoais (anonimizados) como registro de venda do restaurante.</li>
        <li>Tentativas de login: guardamos só um resumo embaralhado do IP ou telefone, por até 1 dia, para bloquear ataques.</li>
      </ul>

      <h2>7. Segurança</h2>
      <p>
        Conexão segura (HTTPS), senhas e PINs embaralhados, criptografia de dados bancários e de CPF, regras de acesso
        no banco (cada restaurante só vê os próprios dados), limite de tentativas contra ataques, verificação
        anti-robô e registros sem dados pessoais. Se acontecer um incidente de segurança que possa causar risco ou
        dano relevante, avisaremos os restaurantes, os titulares afetados e a Autoridade Nacional de Proteção de Dados
        (ANPD), como manda a LGPD.
      </p>

      <h2>8. Seus direitos</h2>
      <p>
        Você pode pedir: confirmação de que tratamos seus dados, acesso, correção, anonimização, bloqueio ou
        eliminação de dados desnecessários, portabilidade, informação sobre com quem compartilhamos, revogação do
        consentimento e revisão de decisões automatizadas, além de se opor a um tratamento.
      </p>
      <ul>
        <li><strong>Cliente de um cardápio:</strong> em “Minha conta”, toque em “Apagar meus dados deste cardápio”. Também pode pedir ao restaurante ou a nós.</li>
        <li><strong>Restaurante ou membro da equipe:</strong> fale com a gente pelos contatos do item 1.</li>
      </ul>
      <p>
        Respondemos em até 15 dias. Se não ficar satisfeito, você pode reclamar à ANPD
        (<a className="underline" href="https://www.gov.br/anpd" target="_blank" rel="noreferrer">gov.br/anpd</a>).
      </p>

      <h2>9. Crianças e adolescentes</h2>
      <p>O cadastro de restaurante é só para maiores de 18 anos. Não coletamos dados de crianças de propósito.</p>

      <h2>10. Mudanças nesta política</h2>
      <p>Quando houver mudança importante, avisamos no painel e atualizamos a data no topo desta página.</p>
    </PaginaLegal>
  );
}
