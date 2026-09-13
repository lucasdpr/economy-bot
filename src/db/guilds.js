const db = require('./index');
const config = require('../config');

const insertGuild = db.prepare(`
  INSERT INTO guilds (guild_id, guild_name, created_at)
  VALUES (?, ?, ?)
  ON CONFLICT(guild_id) DO NOTHING
`);
const selectGuild = db.prepare('SELECT * FROM guilds WHERE guild_id = ?');
const updateGuildName = db.prepare('UPDATE guilds SET guild_name = ? WHERE guild_id = ?');
const updateCurrency = db.prepare('UPDATE guilds SET currency_name = ?, currency_symbol = ? WHERE guild_id = ?');
const setPremium = db.prepare('UPDATE guilds SET premium = ?, premium_until = ? WHERE guild_id = ?');
const allGuilds = db.prepare('SELECT * FROM guilds ORDER BY created_at DESC');

function ensureGuild(guildId, guildName) {
  insertGuild.run(guildId, guildName || null, Date.now());
  if (guildName) updateGuildName.run(guildName, guildId);
  return getGuild(guildId);
}

function getGuild(guildId) {
  const g = selectGuild.get(guildId);
  if (!g) return null;
  return { ...g, premium: isPremiumActive(g) };
}

function isPremiumActive(g) {
  if (!g || !g.premium) return false;
  if (!g.premium_until) return true; // premium sem validade (vitalício)
  return g.premium_until > Date.now();
}

function setCurrency(guildId, name, symbol) {
  updateCurrency.run(name, symbol, guildId);
}

function activatePremium(guildId, days) {
  const until = days && days > 0 ? Date.now() + days * 24 * 60 * 60 * 1000 : null;
  setPremium.run(1, until, guildId);
  return getGuild(guildId);
}

function deactivatePremium(guildId) {
  setPremium.run(0, null, guildId);
  return getGuild(guildId);
}

function listGuilds() {
  return allGuilds.all().map((g) => ({ ...g, premium: isPremiumActive(g) }));
}

function shopLimitFor(guildId) {
  const g = getGuild(guildId);
  const premium = g ? isPremiumActive(g) : false;
  return premium ? config.economy.shopItemLimit.premium : config.economy.shopItemLimit.free;
}

module.exports = {
  ensureGuild,
  getGuild,
  isPremiumActive,
  setCurrency,
  activatePremium,
  deactivatePremium,
  listGuilds,
  shopLimitFor,
};
