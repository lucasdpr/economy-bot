# Economia Bot

Bot de economia para Discord com **loja, ranking, roubo, banco** e um **site** (painel web) onde
administradores fazem login com o Discord para gerenciar a loja e a moeda do servidor. Inclui um
sistema de **Premium por servidor**, ativado manualmente por você (o dono do bot) através de um
painel de administração próprio — ideal para vender o Premium a outros servidores.

## Recursos

- `/saldo`, `/diario`, `/trabalhar`, `/pagar`, `/roubar`, `/banco depositar|sacar`, `/ranking`
- `/loja listar|comprar` e, para admins do servidor, `/loja adicionar|remover` (itens podem dar um cargo automaticamente)
- `/inventario`, `/configurar moeda` (Premium), `/premium status`, `/painel`, `/ajuda`
- Site com:
  - Landing page pública (`/`)
  - Página pública de ranking/loja por servidor (`/g/<id do servidor>`)
  - Login com Discord (OAuth2) e painel de gestão da loja/moeda (`/dashboard`)
  - Painel do dono do bot para ativar/desativar Premium em qualquer servidor (`/owner`)

## 1. Criar a aplicação no Discord

1. Acesse https://discord.com/developers/applications e clique em **New Application**.
2. Na aba **Bot**, clique em **Reset Token** e copie o token → vai virar `DISCORD_TOKEN`.
   - Em **Privileged Gateway Intents**, nenhuma é obrigatória para este bot.
3. Na aba **OAuth2 → General**, copie o **Client ID** (`CLIENT_ID`) e o **Client Secret** (`CLIENT_SECRET`).
4. Ainda em **OAuth2 → General**, em **Redirects**, adicione:
   - `http://localhost:3000/auth/callback` (para testar local)
   - `https://SEU-APP.onrender.com/auth/callback` (depois que tiver a URL do Render)
5. Pegue seu próprio ID de usuário do Discord (ative o **Modo Desenvolvedor** em
   Configurações → Avançado, depois clique com o botão direito no seu nome de usuário e
   "Copiar ID") → vai virar `OWNER_ID`. Só essa conta consegue ativar/desativar Premium.

## 2. Configurar o projeto

```bash
cd economy-bot
npm install
cp .env.example .env
```

Abra o `.env` e preencha `DISCORD_TOKEN`, `CLIENT_ID`, `CLIENT_SECRET` e `OWNER_ID` com os
valores do passo 1. Gere também uma string aleatória para `SESSION_SECRET`.

Opcional: preencha `GUILD_ID` com o ID de um servidor seu para os comandos aparecerem
instantaneamente durante os testes (sem isso, comandos globais levam até 1h para propagar).

## 3. Registrar os comandos de barra e rodar

```bash
npm run register   # registra os comandos /saldo, /diario, etc. no Discord
npm start           # inicia o bot + o site (http://localhost:3000)
```

Convide o bot para um servidor usando o link gerado na landing page (`/`) do site, ou monte
o link manualmente com seu `CLIENT_ID`:

```
https://discord.com/api/oauth2/authorize?client_id=SEU_CLIENT_ID&scope=bot+applications.commands&permissions=268717056
```

## 4. Ativando o Premium de um servidor

Depois de vender o Premium para o dono de outro servidor, ative pelo site:

1. Faça login em `PUBLIC_URL/owner` com a conta Discord definida em `OWNER_ID`.
2. Encontre o servidor na lista, informe a quantidade de dias (deixe em branco para vitalício)
   e clique em **Ativar**.

Também é possível ativar direto pelo Discord com `/premium ativar servidor_id:<id> dias:<n>`
(só funciona para a conta do `OWNER_ID`).

## 5. Deploy no Render

Este projeto já vem com um `render.yaml` pronto (Blueprint do Render):

1. Suba este projeto para um repositório no GitHub.
2. No painel do Render, clique em **New → Blueprint** e aponte para o repositório.
3. O Render vai criar um **Web Service** com plano **Starter** (o SQLite precisa de um disco
   persistente, que não existe no plano gratuito — sem isso, o banco de dados seria apagado a
   cada novo deploy).
4. Preencha as variáveis de ambiente marcadas como "sync: false" no painel do Render:
   `DISCORD_TOKEN`, `CLIENT_ID`, `CLIENT_SECRET`, `OWNER_ID`, `PUBLIC_URL` (a URL que o Render
   te der, ex: `https://economy-bot.onrender.com`) e opcionalmente `GUILD_ID`.
5. Depois do primeiro deploy, volte no Discord Developer Portal e adicione
   `https://SEU-APP.onrender.com/auth/callback` nos **Redirects** do OAuth2 (passo 1.4).
6. Rode `npm run register` uma vez (localmente, com as mesmas credenciais, ou via *Shell* do
   Render) para registrar os comandos de barra globalmente.

> **Sobre persistência dos dados:** o banco fica em `DB_PATH` (por padrão em `/data/economy.sqlite`
> no Render, dentro do disco persistente configurado no `render.yaml`). Se você mudar de plano ou
> remover o disco, os saldos dos usuários serão perdidos — faça backups periódicos baixando esse
> arquivo se isso for importante para o seu negócio.

## Estrutura do projeto

```
src/
  commands/       comandos de barra (/saldo, /loja, /premium, ...)
  db/             acesso ao SQLite (economia, loja, servidores)
  web/            site (Express + EJS): rotas, OAuth2, servidor
  config.js       variáveis de ambiente e regras da economia (valores, cooldowns, limites)
  index.js        inicializa o bot e o site juntos
web/
  views/          páginas EJS do site
  public/         CSS do site
render.yaml       Blueprint de deploy no Render
```

## Personalizando valores da economia

Os valores de recompensa, cooldowns, chance de roubo e limites de Premium ficam centralizados
em `src/config.js`, no bloco `economy`. Ajuste ali para calibrar o quanto os membros ganham por
dia/trabalho, quantos itens cabem na loja de cada plano, etc.
