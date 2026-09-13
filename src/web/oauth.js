const config = require('../config');

const API = 'https://discord.com/api/v10';
const ADMINISTRATOR = 0x8;

function redirectUri() {
  return `${config.publicUrl}/auth/callback`;
}

function loginUrl(state) {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: redirectUri(),
    response_type: 'code',
    scope: 'identify guilds',
    state,
    prompt: 'none',
  });
  return `${API}/oauth2/authorize?${params.toString()}`;
}

async function exchangeCode(code) {
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri(),
  });

  const res = await fetch(`${API}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) throw new Error(`Falha ao trocar código OAuth2: ${res.status} ${await res.text()}`);
  return res.json(); // { access_token, refresh_token, ... }
}

async function fetchUser(accessToken) {
  const res = await fetch(`${API}/users/@me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error('Falha ao buscar usuário do Discord');
  return res.json();
}

async function fetchUserGuilds(accessToken) {
  const res = await fetch(`${API}/users/@me/guilds`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error('Falha ao buscar servidores do usuário');
  return res.json();
}

function canManage(guild) {
  if (!guild) return false;
  if (guild.owner) return true;
  const perms = BigInt(guild.permissions || 0);
  return (perms & BigInt(ADMINISTRATOR)) === BigInt(ADMINISTRATOR);
}

module.exports = { loginUrl, exchangeCode, fetchUser, fetchUserGuilds, canManage };
