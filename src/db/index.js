const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const config = require('../config');

// Garante que a pasta do banco existe
const dir = path.dirname(config.dbPath);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const db = new DatabaseSync(config.dbPath);
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

db.exec(`
CREATE TABLE IF NOT EXISTS guilds (
  guild_id        TEXT PRIMARY KEY,
  guild_name      TEXT,
  currency_name   TEXT NOT NULL DEFAULT 'moeda',
  currency_symbol TEXT NOT NULL DEFAULT '🪙',
  premium         INTEGER NOT NULL DEFAULT 0,
  premium_until   INTEGER,
  created_at      INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  guild_id   TEXT NOT NULL,
  user_id    TEXT NOT NULL,
  username   TEXT,
  balance    INTEGER NOT NULL DEFAULT 0,
  bank       INTEGER NOT NULL DEFAULT 0,
  last_daily INTEGER NOT NULL DEFAULT 0,
  last_work  INTEGER NOT NULL DEFAULT 0,
  last_rob   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (guild_id, user_id)
);

CREATE TABLE IF NOT EXISTS shop_items (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id    TEXT NOT NULL,
  name        TEXT NOT NULL,
  price       INTEGER NOT NULL,
  description TEXT DEFAULT '',
  role_id     TEXT,
  stock       INTEGER NOT NULL DEFAULT -1
);

CREATE TABLE IF NOT EXISTS inventory (
  guild_id TEXT NOT NULL,
  user_id  TEXT NOT NULL,
  item_id  INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (guild_id, user_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_users_guild_balance ON users (guild_id, balance DESC);
CREATE INDEX IF NOT EXISTS idx_shop_guild ON shop_items (guild_id);
`);

/**
 * node:sqlite (DatabaseSync) não tem o helper `db.transaction()` do better-sqlite3.
 * Esta função replica o mesmo uso: `const tx = db.transaction(fn); tx(args)`.
 */
db.transaction = function transaction(fn) {
  return (...args) => {
    db.exec('BEGIN');
    try {
      const result = fn(...args);
      db.exec('COMMIT');
      return result;
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  };
};

module.exports = db;
