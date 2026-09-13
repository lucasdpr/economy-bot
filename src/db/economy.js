const db = require('./index');
const config = require('../config');

const insertUser = db.prepare(`
  INSERT INTO users (guild_id, user_id, username, balance)
  VALUES (?, ?, ?, ?)
  ON CONFLICT(guild_id, user_id) DO NOTHING
`);
const selectUser = db.prepare('SELECT * FROM users WHERE guild_id = ? AND user_id = ?');
const touchUsername = db.prepare('UPDATE users SET username = ? WHERE guild_id = ? AND user_id = ?');
const updateBalance = db.prepare('UPDATE users SET balance = ? WHERE guild_id = ? AND user_id = ?');
const updateBank = db.prepare('UPDATE users SET bank = ? WHERE guild_id = ? AND user_id = ?');
const updateLastDaily = db.prepare('UPDATE users SET last_daily = ? WHERE guild_id = ? AND user_id = ?');
const updateLastWork = db.prepare('UPDATE users SET last_work = ? WHERE guild_id = ? AND user_id = ?');
const updateLastRob = db.prepare('UPDATE users SET last_rob = ? WHERE guild_id = ? AND user_id = ?');
const topByBalance = db.prepare(`
  SELECT * FROM users WHERE guild_id = ?
  ORDER BY (balance + bank) DESC
  LIMIT ?
`);

function getOrCreateUser(guildId, userId, username) {
  insertUser.run(guildId, userId, username || null, config.economy.startingBalance);
  if (username) touchUsername.run(username, guildId, userId);
  return selectUser.get(guildId, userId);
}

function getUser(guildId, userId) {
  return selectUser.get(guildId, userId) || null;
}

function setBalance(guildId, userId, value) {
  updateBalance.run(Math.max(0, Math.round(value)), guildId, userId);
}

function setBank(guildId, userId, value) {
  updateBank.run(Math.max(0, Math.round(value)), guildId, userId);
}

function addBalance(guildId, userId, amount) {
  const u = getOrCreateUser(guildId, userId);
  setBalance(guildId, userId, u.balance + amount);
  return getUser(guildId, userId);
}

/** Transferência atômica entre dois usuários do mesmo servidor. */
const transferTx = db.transaction((guildId, fromId, toId, amount) => {
  const from = getOrCreateUser(guildId, fromId);
  if (from.balance < amount) throw new Error('SALDO_INSUFICIENTE');
  getOrCreateUser(guildId, toId);
  setBalance(guildId, fromId, from.balance - amount);
  const to = getUser(guildId, toId);
  setBalance(guildId, toId, to.balance + amount);
});

function transfer(guildId, fromId, toId, amount) {
  transferTx(guildId, fromId, toId, amount);
}

function claimDaily(guildId, userId, amount) {
  const u = getOrCreateUser(guildId, userId);
  const now = Date.now();
  const remaining = config.economy.dailyCooldownMs - (now - u.last_daily);
  if (remaining > 0) return { ok: false, remainingMs: remaining };
  setBalance(guildId, userId, u.balance + amount);
  updateLastDaily.run(now, guildId, userId);
  return { ok: true, amount };
}

function claimWork(guildId, userId, min, max) {
  const u = getOrCreateUser(guildId, userId);
  const now = Date.now();
  const remaining = config.economy.workCooldownMs - (now - u.last_work);
  if (remaining > 0) return { ok: false, remainingMs: remaining };
  const amount = Math.floor(Math.random() * (max - min + 1)) + min;
  setBalance(guildId, userId, u.balance + amount);
  updateLastWork.run(now, guildId, userId);
  return { ok: true, amount };
}

function attemptRob(guildId, robberId, targetId) {
  const now = Date.now();
  const robber = getOrCreateUser(guildId, robberId);
  const remaining = config.economy.robCooldownMs - (now - robber.last_rob);
  if (remaining > 0) return { ok: false, reason: 'COOLDOWN', remainingMs: remaining };

  const target = getOrCreateUser(guildId, targetId);
  updateLastRob.run(now, guildId, robberId);
  if (target.balance <= 0) return { ok: false, reason: 'ALVO_SEM_DINHEIRO' };

  const success = Math.random() < config.economy.robSuccessChance;
  const maxAmount = Math.floor(target.balance * config.economy.robMaxPercent);
  const amount = Math.max(1, Math.floor(Math.random() * (maxAmount + 1)));

  if (success) {
    setBalance(guildId, targetId, target.balance - amount);
    setBalance(guildId, robberId, robber.balance + amount);
    return { ok: true, success: true, amount };
  }
  // Falhou: paga multa igual à tentativa
  const fine = Math.min(robber.balance, amount);
  setBalance(guildId, robberId, robber.balance - fine);
  return { ok: true, success: false, fine };
}

function deposit(guildId, userId, amount) {
  const u = getOrCreateUser(guildId, userId);
  if (amount > u.balance) return { ok: false };
  setBalance(guildId, userId, u.balance - amount);
  setBank(guildId, userId, u.bank + amount);
  return { ok: true };
}

function withdraw(guildId, userId, amount) {
  const u = getOrCreateUser(guildId, userId);
  if (amount > u.bank) return { ok: false };
  setBank(guildId, userId, u.bank - amount);
  setBalance(guildId, userId, u.balance + amount);
  return { ok: true };
}

function leaderboard(guildId, limit = 10) {
  return topByBalance.all(guildId, limit);
}

/** Aplica juros diários no banco de todos os usuários premium (chamado por um cron simples). */
const applyInterestTx = db.transaction((guildId, rate) => {
  const users = db.prepare('SELECT guild_id, user_id, bank FROM users WHERE guild_id = ? AND bank > 0').all(guildId);
  for (const u of users) {
    const gain = Math.floor(u.bank * rate);
    if (gain > 0) updateBank.run(u.bank + gain, guildId, u.user_id);
  }
});

function applyInterest(guildId, rate) {
  applyInterestTx(guildId, rate);
}

module.exports = {
  getOrCreateUser,
  getUser,
  setBalance,
  setBank,
  addBalance,
  transfer,
  claimDaily,
  claimWork,
  attemptRob,
  deposit,
  withdraw,
  leaderboard,
  applyInterest,
};
