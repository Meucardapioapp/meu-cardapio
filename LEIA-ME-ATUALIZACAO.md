# Auditoria de segurança e LGPD — 19/10 (LEIA ANTES DE LANÇAR)

## AGORA (site antigo no ar)
- Rodar no Supabase: `supabase/17_URGENTE_rodar_agora.sql` (fecha a vista pública que aceitava alterar/apagar restaurantes). Resultado tem que vir vazio.
- Rodar também: `supabase/18_tabelas_antigas.sql` (fecha as tabelas antigas sem uso orders/faixas_entrega/taxas_entrega). Resultado vazio.
- Conferir com o `99_auditoria_seguranca.sql`: antes do lançamento só pode sobrar a linha "cardapio publico le restaurantes" (o site antigo precisa dela; some no lançamento).

## Dia do lançamento — ordem
1. Vercel: conferir as variáveis (todas): NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, DADOS_CRIPTO_CHAVE (32 bytes base64), RATE_LIMIT_SALT (texto aleatório longo), CRON_SECRET, OWNER_USER_ID, PAGARME_SECRET_KEY, NEXT_PUBLIC_PAGARME_PUBLIC_KEY, PAGARME_PLANO_MENSAL_ID, PAGARME_PLATFORM_RECIPIENT_ID, PAGARME_WEBHOOK_USER e PAGARME_WEBHOOK_PASSWORD (os mesmos no webhook da Pagar.me), NEXT_PUBLIC_TURNSTILE_SITE_KEY e TURNSTILE_SECRET_KEY, RESEND_API_KEY, EMAIL_REMETENTE, VAPID_* (avisos), WHATSAPP_* (se usar).
2. Publicar o site novo.
3. SQL: 01 → 05 → **16_blindagem_final** → 07. Depois rode `99_auditoria_seguranca.sql`: **tem que vir sem nenhuma linha**.
4. Supabase → Authentication:
   - Sign In / Providers → **desligar "Allow new users to sign up"** (o site cria as contas pelo servidor).
   - Attack Protection → **ligar Captcha** (Cloudflare Turnstile, com o TURNSTILE_SECRET_KEY) e **"Prevent use of leaked passwords"**.
5. Abrir meucardapioapp.com/seguranca (logado como dono da plataforma): tudo verde; clicar em "Criptografar dados" uma vez (dados bancários e CPF de clientes antigos).
6. GitHub: deixar o repositório **privado** (Settings → General → Danger Zone → Change visibility). A Vercel continua funcionando.
7. Preencher `lib/legal.ts` (razão social, CNPJ, endereço, e-mail de privacidade, cidade do foro). Campos vazios não aparecem.

## O que mudou no código
- Clientes podem apagar os próprios dados ("Minha conta" → "Apagar meus dados deste cardápio"); pedidos ficam sem nome/telefone/endereço.
- CPF do cliente agora fica criptografado.
- Pixel do Meta só carrega depois que o cliente aceita os cookies (aviso no cardápio; "Cookies" no rodapé para mudar).
- Política de Privacidade e Termos reescritos (LGPD: papéis controlador/operador, bases legais, fornecedores, transferência internacional, retenção, direitos, incidentes; salão, equipe, taxa de serviço, foro). Donos aceitam a nova versão uma vez no painel.
- Aviso de privacidade no checkout.
- PIN da equipe: limite também por dia; login do cliente idem; limite de pedidos por telefone (contra pedidos falsos).
- Sessão da equipe recusa pedidos vindos de outros sites (CSRF).
- Registros de erro da Pagar.me sem dados pessoais.
- /seguranca testa também a vista pública.

# Atualização 19/10 — Restaurante (salão): mesas, garçom, cozinha e equipe

**Rodar no Supabase (SQL Editor):** `supabase/15_salao_e_equipe.sql` (pode rodar mesmo sem ter rodado o 14; só cria tabelas e acrescenta colunas — o site antigo continua igual).
No final aparece "Salão pronto". Se a coluna `links_em_conflito` mostrar algum nome, me avise.

Menu novo **Restaurante (salão)**:
1. **Equipe**: cadastre garçons, cozinha (escolha o setor: Cozinha, Churrasqueira, Bar ou Todos) e motoboys. Cada um recebe um PIN; botão "Enviar para ele" manda no WhatsApp. Todos entram em **meucardapioapp.com/equipe**.
2. **Mesas e comandas**: as mesas abertas aparecem aqui. Quando o garçom manda pedido, a mesa acende "NOVO PEDIDO" e toca; quando a mesa pede a conta, acende "PEDIU A CONTA".
   - Clique na mesa: vê tudo o que foi pedido com o valor somado, altera quantidade ou cancela item, adiciona itens.
   - **Taxa de serviço**: um botão liga/desliga os 10% (soma na hora). Sem apertar, não tem taxa.
   - **Fechar conta**: escolhe Pix, Débito, Crédito ou Dinheiro (com troco) — dá para dividir em mais de uma forma. Entra no relatório.
   - **Imprimir conta** (para o garçom levar na mesa) e imprimir o pedido para a cozinha.
   - **Configurar**: % da taxa, se já vem ligada, setores e onde cada categoria é preparada (bebida = "sem preparo").
3. **Relatório da equipe**: vendas do salão, formas de pagamento, e por pessoa: mesas, pedidos, itens, quantos pagaram 10% e quanto cada garçom ganhou de 10%; itens preparados pela cozinha; entregas e taxas dos motoboys.
- **Pedidos (delivery)** agora é só do delivery. Pedido feito pelo QR Code da mesa vai direto para a comanda da mesa.
- Os Relatórios gerais mostram também o total do salão (e a planilha traz as contas das mesas).
- O atendente do painel (login por e-mail) também vê "Mesas e comandas" e pode fechar contas.

Celular da equipe (meucardapioapp.com/equipe):
- **Garçom**: abre a mesa, anota pelo cardápio (sem fotos, só nome e preço), observação em cada item, envia. Vê o que ficou pronto (com aviso), marca servido, pede a conta, altera o que a cozinha ainda não preparou. No topo: mesas atendidas, pedidos, quantas com 10% e quanto ganhou de 10% no dia.
- **Cozinha / churrasqueira / bar**: cada setor vê só os seus itens, com a mesa em destaque, tempo esperando, observações, "ALTERADO"/"CANCELADO". Toca quando chega pedido. Botão "Pronto" avisa o garçom.
- **Motoboy**: igual antes (mesmo login da equipe).

# Atualização 17/10 (tarde) — Motoboys

**Rodar no Supabase (SQL Editor):** `supabase/14_motoboys.sql` (pode rodar no banco do site antigo, só acrescenta colunas).
(Se ainda não rodou: o `13_versao_antiga_pedidos.sql` também.)

Como funciona:
1. Painel → **Motoboys**: cadastre nome + celular. Aparece um PIN de 4 números → botão "Enviar para ele" manda o acesso no WhatsApp do motoboy.
2. O motoboy abre **meucardapioapp.com/entregador**, entra com celular + PIN e deixa a tela aberta (fica conectado).
3. Em **Pedidos**, toque em "Enviar p/ motoboy" no pedido → chega no celular dele com aviso sonoro: número do pedido, cliente, telefone, endereço com Google Maps/Waze, quanto cobrar (dinheiro/troco, maquininha ou já pago).
4. O motoboy toca "Peguei — saí para entrega" (o pedido vai para "Saiu" no painel e o cliente é avisado) e depois "Entreguei" (vai para "Concluídos").
5. A tela Motoboys mostra entregas e taxas de cada um (hoje / 7 dias) para o acerto.
- Atendentes da equipe também podem enviar pedidos para os motoboys.
- "Enviar acesso" gera PIN novo e desconecta o celular antigo. O cadeado bloqueia na hora.

# ⚠️ Enquanto a versão antiga estiver no ar

O banco de dados é o mesmo para a versão antiga (no ar) e a nova (no seu computador). Enquanto a Vercel tiver a versão antiga, deixe rodado o `supabase/06_compatibilidade_versao_antiga.sql`: ele devolve só o que a versão antiga precisa (cardápio lendo os restaurantes, Pix, mudar status do pedido, tela de clientes e envio de fotos). Nesse período, a página /seguranca vai mostrar "Ler e-mails dos donos" como aberto: é esperado.

**No dia de publicar a versão nova:**
1. Coloque na Vercel as variáveis do `.env.local` (principalmente a MESMA `DADOS_CRIPTO_CHAVE`).
2. Publique o site novo.
3. No Supabase, rode de novo `01_assinatura_e_seguranca.sql` (ele ignora o marcador "•••" do SQL 11), depois `05_blindagem.sql` (fecham tudo de novo e movem dados bancários novos para a tabela protegida) e por último `07_dia_do_lancamento.sql` (dá 15 dias grátis a partir do dia do lançamento para quem já usava).
4. Abra meucardapioapp.com/seguranca e confira tudo verde.

---

# Atualização de 17/10/2026: contas bancárias no site antigo, ingredientes e zoom

## ⚠️ Rode agora no Supabase (corrige o site antigo que está no ar)
`supabase/11_versao_antiga_contas_bancarias.sql`: o painel antigo voltou a pedir conta bancária porque o SQL 01 levou os dados para a tabela protegida. Este arquivo devolve ao site antigo o banco, o tipo de conta e o recebedor da Pagar.me, e põe o marcador "•••" (protegido) no CPF, na agência e na conta. Os menus voltam a ser liberados e nenhum dado real fica exposto. Nada é apagado; no lançamento o SQL 01 limpa de novo e nunca troca o dado real pelo marcador.

Rode também `supabase/12_ingredientes.sql` (só acrescenta uma coluna).

## O que mudou
- **Ingredientes:** cada sabor/opção dos itens obrigatórios e cada adicional têm o campo "Ingredientes (opcional)". O cliente vê embaixo do nome no cardápio. Ex.: Pizza G → Sabor Calabresa → "massa, molho, muçarela, calabresa e cebola".
- **Zoom:** a barra do topo do painel (situação da loja e sino) não cobre mais os títulos e botões. Produtos e Horários se ajustam a qualquer zoom e largura.

---

# Atualização de 16/10/2026: plano único, cancelamento e cobrança conferida

- **Plano anual retirado.** Agora só existe o Plano Mensal de R$ 79,90 (tela Meu plano, site, perguntas frequentes e termos).
- **Cancelar plano** fica em **Minha conta**: o dono escolhe o motivo, conta o que podemos melhorar e digita a senha. O sistema cancela a assinatura na Pagar.me **e confere na própria Pagar.me que ficou cancelada** (inclusive faturas pendentes). Se a Pagar.me não confirmar, nada muda e aparece um aviso para tentar de novo. O mês já pago continua valendo até o fim.
- Os motivos ficam na tabela `cancelamentos` do Supabase (Table Editor → cancelamentos).
- **Conferência automática com a Pagar.me:** ao abrir Meu plano, e todo dia na rotina de avisos, o sistema pergunta direto para a Pagar.me se há Pix do plano pago ou mensalidade do cartão paga que ainda não foi lançada. Se o aviso automático (webhook) falhar ou atrasar, o plano libera mesmo assim. Cada pagamento continua contando uma vez só.
- **Corrigido:** depois de gerar um Pix, trocar para a aba Cartão deixava o botão travado em "Confirmando pagamento…". Agora, no cartão aprovado na hora, o plano já aparece ativo.

## SQL
Rode `supabase/10_cancelamentos.sql` (só acrescenta uma tabela; pode rodar agora, mesmo com a versão antiga no ar).

## Pagar.me: avisos automáticos (webhook)
No painel da Pagar.me → Configurações → Webhooks, cadastre:
- URL: `https://meucardapioapp.com/api/pagarme/webhook` (só depois de publicar a versão nova)
- Usuário e senha: os mesmos `PAGARME_WEBHOOK_USER` e `PAGARME_WEBHOOK_PASSWORD` do `.env.local`
- Eventos: `order.paid`, `order.payment_failed`, `order.canceled`, `charge.paid`, `charge.payment_failed`, `invoice.paid`, `invoice.payment_failed`, `invoice.canceled`, `subscription.canceled`, `transfer.paid`, `transfer.failed`

---

# Atualização de 14/10/2026 (lotes 1 a 5): funções novas e velocidade

## SQL: pode rodar agora (não quebra a versão antiga)

No Supabase → SQL Editor, rode **na ordem** (cada um pode ser rodado de novo sem problema):

1. `supabase/08_novidades.sql`: pausar pedidos e tempos, termos de uso, promoção por dia/horário, estoque, "peça também", meio a meio, pedido pela mesa, avaliações, equipe, avisos no celular e e-mails.
2. `supabase/09_entrega_por_km_e_pix_chave.sql`: entrega cobrada por distância e Pix na chave do próprio restaurante.

Os dois só **acrescentam** tabelas e colunas. No dia do lançamento, a ordem continua: 01 → 05 → 07 (veja acima).

## Variáveis novas (só no dia de publicar, na Vercel)

| Variável | Para quê | Obrigatória? |
| --- | --- | --- |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | Aviso de pedido novo no celular do restaurante. Gere com `node scripts/gerar-segredos.mjs` (já acrescenta no `.env.local`) | Sim, para o aviso no celular |
| `RESEND_API_KEY`, `EMAIL_REMETENTE` | E-mails para o dono: boas-vindas, plano vencendo em 5 dias, pagamento confirmado, cardápio fora do ar (resend.com, plano grátis de 3.000/mês) | Recomendada |
| `CRON_SECRET` | Protege a rotina diária de avisos (`vercel.json` já agenda para 12h UTC) | Sim, se usar os e-mails |
| `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_TEMPLATE_PEDIDO`, `WHATSAPP_TEMPLATE_IDIOMA` | WhatsApp automático para o cliente final (API oficial da Meta, **paga por mensagem**). Sem elas, o botão "Avisar cliente" continua abrindo o WhatsApp normal, sem custo | Opcional |
| `PAGARME_PLANO_ANUAL_ID` | Não é mais usada (plano anual retirado). Pode apagar | — |
| `GEOCODER_URL` | Só se quiser trocar o serviço de mapa da entrega por km (padrão: OpenStreetMap, grátis) | Não |

## O que entrou (e onde fica no painel)

O menu principal continua o mesmo: **Pedidos, Editar Cardápio e Produtos** na frente. O resto fica dentro das telas que já existiam, sem itens novos espalhados.

**Pedidos e operação**
- **Pausar pedidos agora** (30 min, 1 hora ou até você reativar) e situação da loja (aberta/fechada/pausada) no topo do painel.
- **Pedidos em colunas no computador** (Novos, Em preparo, Saiu/Pronto, Concluídos); no celular continua a lista. Dá para voltar para a lista no botão "Colunas / Lista".
- **Aviso no celular** do restaurante (instalar o painel como app) e **equipe**: atendente com acesso só aos pedidos.
- **Impressão** da comanda, com mesa, troco e distância.

**Cardápio e vendas**
- **Tempo de entrega e de retirada** aparecendo no cardápio.
- **Meio a meio** (cobra pelo maior sabor ou pela média), **promoção por dia e horário**, **estoque** (esgota sozinho) e **"Peça também"** no carrinho: tudo em "Opções avançadas" do produto.
- **Mais pedidos** no topo do cardápio, **avaliações reais** dos clientes (substituem a nota falsa 4,9) e **pedido pela mesa** com QR Code (em Link do cardápio).
- **Relatórios**: vendas por dia/semana/mês, produtos mais vendidos, ticket médio, exportar para Excel (CSV). O Início compara hoje com ontem.

**Entrega por distância (novo neste lote)**
- Em **Taxa de entrega**, escolha "Por bairro" (como sempre) ou **"Por distância"**: marca onde fica o restaurante ("Estou no restaurante agora" usa o GPS do celular) e cadastra faixas, ex.: até 3 km = R$ 5, até 6 km = R$ 8.
- O cliente digita o endereço e o sistema calcula a distância em linha reta. Acima da última faixa aparece "fora da área de entrega".
- A taxa é sempre recalculada no servidor na hora do pedido (o cliente não consegue mudar).

**Formas de pagamento (novo neste lote)**
- A tela agora tem 3 blocos: **na entrega/retirada** (dinheiro, cartão na maquininha do restaurante), **Pix na sua chave** e **Pix online automático**.
- **Pix na sua chave: sem taxa.** O restaurante cadastra a própria chave Pix (pede a senha do painel, para ninguém trocar a chave com uma sessão roubada). O cliente recebe o Pix copia e cola **com o valor do pedido** e um botão para mandar o comprovante no WhatsApp. O pedido chega na hora com o selo "Confira o Pix na sua conta" e o restaurante marca **"Pix recebido"**.
- **Pix online automático** continua opcional, com 1% para a plataforma. A plataforma não cobra nada sobre dinheiro, cartão ou Pix na chave do restaurante: só a mensalidade.

**Velocidade**
- Cardápio: os dados vêm prontos do servidor em poucas consultas paralelas (antes eram 2 consultas por produto, feitas pelo celular do cliente), fotos carregam conforme a rolagem, sem mensagens de depuração.
- Imagens do site: `favicon.ico` de 960 KB → 4 KB (ele era baixado em todas as páginas, inclusive no cardápio), ícone da Apple 960 KB → 25 KB, imagem de compartilhamento 1,6 MB → 370 KB, tutorial de bairros 1,2 MB → 520 KB.
- Painel: telas carregam os dados de uma vez só (produto, formas de pagamento, entrega, editor de cardápio).

**Termos e privacidade**
- Páginas `/termos` e `/privacidade` e aceite obrigatório no cadastro.

> A imagem de compartilhamento (`public/og-image.png`, a que aparece quando alguém manda o link do site) ainda diz **"Sem mensalidade"**. Troque a arte antes do lançamento.

---

# Atualização de 14/10/2026: blindagem de segurança

## Ordem para publicar (importante)

1. **Publique o site novo primeiro** (Vercel). O site já sabe funcionar antes e depois do SQL novo.
2. **Depois** rode `supabase/05_blindagem.sql` no Supabase (SQL Editor → Run). No final aparece um resumo (NOTICE) do que foi fechado.
3. Entre com a sua conta de dono da plataforma (a do `OWNER_USER_ID`) e abra **meucardapioapp.com/seguranca**. A página tenta invadir o sistema com a chave pública, como um hacker faria, e mostra em verde o que está protegido e em vermelho o que falta configurar.

## Configurações que só você pode fazer (fora do código)

| Onde | O que fazer | Por quê |
| --- | --- | --- |
| Vercel → Environment Variables | Confirme `DADOS_CRIPTO_CHAVE`, `RATE_LIMIT_SALT`, `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `PAGARME_WEBHOOK_USER` e `PAGARME_WEBHOOK_PASSWORD` (a página /seguranca mostra o que falta) | Sem elas, criptografia, captcha e senha do webhook ficam desligados |
| Vercel → Settings → Deployment Protection | Ligue a proteção dos *Preview Deployments* | Links de teste usam as mesmas chaves secretas |
| Vercel → Firewall | Deixe o firewall ligado; em ataque, ative o *Attack Challenge Mode* | Segura ataque de muitas requisições (DDoS) |
| Supabase → Database → Network Restrictions | Bloqueie o acesso direto ao Postgres (portas 5432/6543) para todos os IPs, ou só libere o seu | O site não usa essas portas (fala com o banco pela API). São as únicas "portas abertas" do seu sistema |
| Supabase → Database → Settings | Troque a senha do banco por uma longa e aleatória; deixe *Enforce SSL* ligado | Protege as portas acima |
| Supabase → Authentication → Attack Protection | Captcha (Turnstile) ligado e, se o plano permitir, *Leaked password protection* | Bloqueia robô e senha vazada |
| Supabase → API → GraphQL | Desligue se não usa | Menos uma porta de entrada |
| Contas de Vercel, Supabase, Pagar.me, GitHub, Cloudflare e o seu e-mail | Ligue verificação em 2 etapas (2FA) em todas | Quem entra numa dessas contas tem o sistema inteiro |
| GitHub | Deixe o repositório **privado** | Código aberto ajuda quem procura falhas |

## O que mudou nesta atualização

- **Dados dos donos escondidos:** antes, qualquer pessoa conseguia baixar e-mail, nome do responsável e telefone pessoal de todos os restaurantes usando a chave pública do site. Agora o cardápio lê a vista `restaurantes_publico`, que só tem dados públicos.
- **Dono não altera colunas internas:** pelo navegador, o dono só altera endereço e Pixel do próprio restaurante (antes podia mexer em qualquer coluna, inclusive o dono da conta).
- **RLS em todas as tabelas** e acesso do navegador fechado em tudo que é só do servidor (clientes, cupons, assinaturas, dados bancários, saques…). Funções internas do banco não podem mais ser chamadas pelo navegador.
- **Dinheiro protegido contra sessão roubada:** trocar a conta bancária e sacar pedem a **senha de novo**. Depois de trocar a conta, saques ficam travados por **24 horas**.
- **Dados bancários mascarados:** o painel só recebe o final dos números (ex.: •••456). O número completo nunca volta para o navegador.
- **Fotos:** só imagens (JPG, PNG, WEBP, GIF, AVIF) de até 5 MB, e cada restaurante só envia/apaga na própria pasta.
- **Limite de tentativas** em todas as rotas públicas (pedido, status, frete, cliente, cupom, fidelidade, webhook) e nas ações do painel.
- **Token do cliente** saiu da URL (ia parar nos registros de acesso) e foi para um cabeçalho.
- **Cliente não "assume" a conta de outro** trocando o telefone para o de outra pessoa.
- **Cabeçalhos de segurança** extras e páginas privadas fora do Google.
- **Dependências:** `npm audit --omit=dev` = 0 vulnerabilidades. Os 5 avisos restantes são só do ESLint (ferramenta de programação que não vai para o site) e ainda não têm correção.

---

# Atualização de 13/10/2026: segurança reforçada, editor visual e produtos

> Se você ainda não fez a atualização de 12/10 (mais abaixo), faça as duas juntas: rode os **3** arquivos SQL na ordem.

## Antes de publicar

1. **`npm install`** — o Next.js foi atualizado para a versão 16.4.0 (corrige uma falha **crítica**), e foram removidos o Playwright, o Cheerio e o shadcn (sem uso). `npm audit --omit=dev` agora mostra **0 vulnerabilidades**.
2. **SQL no Supabase** (SQL Editor → Run), nesta ordem: `supabase/01_assinatura_e_seguranca.sql`, `supabase/02_regras_de_acesso_rls.sql`, `supabase/03_limite_de_tentativas.sql`, `supabase/04_fidelidade_cupons_e_guia.sql` (e o `05_blindagem.sql` depois de publicar o site, veja acima).
   - **O erro "Não foi possível criar o pedido" acontece quando o SQL 01 ainda não foi rodado** (faltam as colunas `codigo_acesso` e `troco_para`). Agora, se isso acontecer, a mensagem diz exatamente isso.
3. **Novas variáveis de ambiente** (Vercel → Settings → Environment Variables, e também no `.env.local` para testar no seu computador):

| Variável | Obrigatória? | O que é |
| --- | --- | --- |
| `DADOS_CRIPTO_CHAVE` | Sim | Chave que criptografa CPF/CNPJ e conta bancária no banco. Gere com `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`. **Guarde num lugar seguro: se perder, os dados criptografados não abrem mais.** |
| `RATE_LIMIT_SALT` | Sim | Qualquer texto aleatório longo (ex.: gere outro com o mesmo comando acima). |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` e `TURNSTILE_SECRET_KEY` | Recomendada | Proteção contra robôs da Cloudflare (grátis). Crie em dash.cloudflare.com → Turnstile → Add site (domínio `meucardapioapp.com`). |

4. **Supabase → Authentication**:
   - *Sign In / Providers → Email → Password requirements*: mínimo 8, com minúscula, maiúscula, número e símbolo (igual ao site).
   - *Attack Protection → Enable Captcha protection*: Turnstile, colando a mesma `TURNSTILE_SECRET_KEY`. Faça isso **depois** de publicar com as chaves do passo 3.
   - *Rate Limits*: confira se estão ligados (padrão do Supabase).
5. **Supabase → Storage:** o SQL 05 já configura as regras das fotos. Se no resumo aparecer "Não foi possível ajustar o Storage", crie no painel (Storage → Policies) as regras: leitura pública; enviar/alterar/apagar só `authenticated` e só na pasta com o ID do próprio restaurante.
6. **GitHub: deixe o repositório privado.** O `github.com/Meucardapioapp/meu-cardapio` está **público**. Verifiquei os 250 commits e nenhuma chave secreta foi publicada, mas com o código aberto qualquer pessoa estuda o sistema procurando falhas. GitHub → Settings → General → Danger Zone → Change visibility → Private.

## O que mudou nesta atualização

- **Erro ao finalizar pedido:** mensagem clara quando o banco não foi atualizado e, no seu computador (localhost), mostra o detalhe técnico do erro.
- **Site:** o plano mensal agora é o destaque ("Mais escolhido").
- **Cadastro e troca de senha:** senha com 8+ caracteres, maiúscula, minúscula, número e caractere especial, com medidor Fraca/Média/Forte e lista do que falta. A regra também é conferida no servidor.
- **Limite de tentativas no banco:** cadastro, login do cliente, pedidos, Pix e saques têm limite por IP que vale para todos os servidores (antes ficava na memória de cada servidor). Login do cliente também tem limite por telefone.
- **Proteção contra robôs:** Turnstile no cadastro, login e recuperação de senha + campo-armadilha invisível no cadastro.
- **Criptografia:** CPF/CNPJ, agência e conta são guardados criptografados (AES-256-GCM). Dados antigos são criptografados sozinhos na primeira vez que forem lidos.
- **Política de segurança de conteúdo (CSP) com nonce:** só scripts do próprio site rodam, o que bloqueia a maior parte dos ataques de injeção de código (XSS) — o jeito mais comum de roubar a sessão de quem está logado.
- **HTTPS forçado** (redirecionamento + HSTS) e painel fora do Google (`noindex`).
- **Validação de entradas** com `zod` no cadastro e nos dados do cliente; o ID do Meta Pixel e o JSON de SEO são limpos antes de ir para a página.
- **Importar cardápio** removido (menu, página, rota e dependências).
- **Aparência:** editor visual — um molde do cardápio onde você toca no banner, logo, nome, cor, horários, pedido mínimo ou categorias e vê o resultado na hora.
- **Produtos:** lista em cartões (funciona no celular, botão Editar sempre visível, chave "Visível/Esgotado"), e cadastro em 3 passos com exemplos, atalhos ("Escolha o tamanho", "Escolha a borda"…) e prévia de como o cliente vê.

## Sobre senhas, chaves e cookies

- **Senhas** dos donos já são guardadas com hash (bcrypt) pelo Supabase Auth; o sistema nunca vê nem guarda a senha.
- **Chave pública do banco** (`NEXT_PUBLIC_SUPABASE_ANON_KEY`): ela é pública por natureza e aparece no navegador. O que protege os dados são as regras do SQL 02 (RLS). A chave secreta (`SUPABASE_SERVICE_ROLE_KEY`) só é usada no servidor e o build falha se alguém tentar usá-la no navegador (`server-only`).
- **Consultas ao banco** passam pelo supabase-js, que já envia tudo parametrizado (não há SQL montado com texto do usuário).
- **Cookies:** o sistema não cria cookies próprios; a sessão do Supabase fica no navegador e é protegida pela CSP acima.

---

# Atualização de 12/10/2026: segurança, assinatura R$ 79,90 e painel no celular

Siga os passos **nesta ordem**. Leva uns 20 minutos.

## 1. Instalar as dependências

Algumas bibliotecas sem uso foram removidas (Stripe, Mercado Pago, SDK antigo da Pagar.me etc.) e uma foi adicionada (`server-only`). No terminal, dentro da pasta do projeto:

```bash
npm install
npm run build
```

O `npm run build` precisa terminar sem erro.

## 2. Rodar o SQL no Supabase

Supabase → seu projeto → **SQL Editor** → **New query**.

1. Cole o conteúdo de `supabase/01_assinatura_e_seguranca.sql` e clique em **Run**.
   - Cria as tabelas do plano (`assinaturas`, `pagamentos_assinatura`, `planos_pagarme`).
   - Move os dados bancários para uma tabela protegida (`restaurantes_financeiro`).
   - Cria o código secreto de cada pedido e o campo de troco.
   - Dá **7 dias de teste** para todos os restaurantes que já existem (dá para mudar no item 5 do arquivo).
2. Cole o conteúdo de `supabase/02_regras_de_acesso_rls.sql` e clique em **Run**.
   - Cada dono só consegue alterar o próprio restaurante, e o público só consegue ler o cardápio.
   - Se aparecer uma mensagem "Tabelas sem ligação com restaurante", mande para revisar.

Os dois scripts podem ser rodados mais de uma vez sem problema.

## 3. Variáveis de ambiente (Vercel → Settings → Environment Variables)

| Variável | Obrigatória? | Para que serve |
| --- | --- | --- |
| `PAGARME_PLATFORM_RECIPIENT_ID` | Sim (já existe) | Recebedor da plataforma, que fica com o 1% do Pix. Antes estava escrito direto no código. |
| `PAGARME_WEBHOOK_USER` e `PAGARME_WEBHOOK_PASSWORD` | Recomendada | Usuário e senha que a Pagar.me envia no webhook. Use os mesmos valores no painel da Pagar.me (passo 4). |
| `WHATSAPP_VERIFY_TOKEN` | Opcional | Token do webhook do WhatsApp. Antes estava fixo no código. |
| `PAGARME_PLANO_MENSAL_ID` e `PAGARME_PLANO_ANUAL_ID` | Opcional | Só se quiser fixar os planos. Sem elas, o sistema cria os planos na Pagar.me sozinho na primeira assinatura. |

## 4. Pagar.me (painel da Pagar.me)

1. **Webhook** → URL `https://meucardapioapp.com/api/pagarme/webhook`, com estes eventos:
   `order.paid`, `order.payment_failed`, `order.canceled`, `charge.paid`, `charge.payment_failed`,
   `invoice.paid`, `invoice.payment_failed`, `subscription.created`, `subscription.canceled`,
   `transfer.created`, `transfer.paid`, `transfer.failed`.
   Se o painel tiver a opção de autenticação (usuário e senha), use os valores do passo 3.
2. **Chave pública** → confirme que o domínio `meucardapioapp.com` está liberado para a chave pública (`pk_...`). Sem isso, o cartão da assinatura não é aceito.

## 5. Publicar e testar

Publique na Vercel e faça este teste rápido:

- [ ] Abrir o cardápio no celular, montar um pedido e pagar em **dinheiro com troco**. O painel deve **tocar o sino** (toque uma vez na tela do painel para liberar o som).
- [ ] Aceitar o pedido no painel pelo celular e imprimir a comanda.
- [ ] Fazer um pedido com **Pix** (o CPF só é pedido nessa hora) e pagar R$ 1,00 de teste.
- [ ] Em **Meu plano**, gerar o Pix do plano mensal ou assinar com cartão e ver o status mudar para "Ativo".
- [ ] Abrir `https://meucardapioapp.com/api/pedido?id=1` no navegador. Deve responder "Pedido não informado" (antes mostrava os dados do cliente).

## O que mudou

**Segurança**
- Todas as rotas do painel exigem login. O restaurante é descoberto pelo login, não por um ID enviado pelo navegador. Antes era possível trocar a conta bancária, sacar ou mudar o WhatsApp de qualquer restaurante.
- Preços, frete, desconto e total são recalculados no servidor. O Pix usa o valor gravado no pedido.
- O webhook confere cada pagamento direto na API da Pagar.me antes de marcar como pago.
- Para acompanhar um pedido é preciso o código secreto do pedido; o CPF e o token do cliente não saem mais do servidor.
- O login do cliente pede telefone **e** o número de um pedido anterior.
- Rotas de teste e de manutenção foram desativadas, os logs com dados pessoais foram removidos e foram adicionados limite de tentativas e cabeçalhos de segurança.

**Cobrança**
- Plano único: R$ 79,90/mês ou R$ 799/ano. São 7 dias grátis a partir do cadastro, sem pedir cartão.
- O pagamento pode ser feito no cartão (cobrança automática) ou por Pix (paga o período de uma vez).
- Quando o plano vence, o cardápio continua no ar, mas os pedidos online ficam pausados e aparece o aviso "peça pelo WhatsApp". O cartão recusado tem 3 dias de tolerância.
- Tela **Meu plano** no painel e faixa de aviso do teste grátis.
- A taxa de R$ 0,99 cobrada do consumidor foi removida. Continua só o 1% sobre o Pix online.

**Cliente final**
- O CPF só é pedido quando o cliente escolhe Pix online.
- Campo "troco para quanto" e desconto de fidelidade aplicado no checkout.
- O Pix online só aparece se o restaurante tiver cadastrado os dados bancários. Sem eles, o restaurante vende com dinheiro e cartão na entrega (que agora vêm ligados por padrão).

**Painel**
- Sino que toca até o pedido ser aceito, notificação, aba piscando e impressão automática opcional.
- Tela de pedidos refeita para celular: abas, cartões, botão grande "Aceitar" e aviso ao cliente pelo WhatsApp.
- Menu inferior no celular e ajustes de layout em todas as telas.
- Dados bancários deixaram de ser obrigatórios para usar o painel.

## Arquivos que podem ser apagados

Estes arquivos ficaram desativados (respondem "Rota desativada"). Pode apagar as pastas:

`app/api/checkout`, `app/api/autocomplete`, `app/api/reverse-geocode`, `app/api/importar-cidades`,
`app/api/importar-cardapio/salvar`, `app/api/pagarme/criar-pagamento`, `app/api/pagarme/listar-recebedores`,
`app/api/pagarme/recipient`, `app/api/pedido/atualizar`, `app/api/configuracoes/[id]`, `app/api/cliente/route.ts`,
`app/pix`, `app/pedido-aprovado`, `app/components/CheckoutModal.tsx`, `lib/payment`.

## Ficou para a próxima etapa

- Código por WhatsApp/SMS no login do cliente (precisa de um provedor de WhatsApp/SMS).
- Políticas do Storage do Supabase (upload de imagens): confira no Supabase → Storage → Policies se só usuários logados podem enviar arquivos.
- O importador de cardápio usa Playwright, que não roda na Vercel.
