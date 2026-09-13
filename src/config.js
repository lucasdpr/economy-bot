const path = require('path');
require('dotenv').config();

const port = process.env.PORT || 3000;

module.exports = {
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  guildId: process.env.GUILD_ID || null,
  ownerId: process.env.OWNER_ID || null,
  port,
  publicUrl: (process.env.PUBLIC_URL || `http://localhost:${port}`).replace(/\/$/, ''),
  sessionSecret: process.env.SESSION_SECRET || 'insecure-dev-secret-troque-isso',
  dbPath: process.env.DB_PATH || path.join(__dirname, '..', 'data', 'economy.sqlite'),

  // Regras de economia (ajuste à vontade)
  economy: {
    startingBalance: 200,
    dailyAmount: { free: 100, premium: 250 },
    workRange: { free: [40, 150], premium: [80, 300] },
    dailyCooldownMs: 24 * 60 * 60 * 1000,
    workCooldownMs: 60 * 60 * 1000,
    robCooldownMs: 3 * 60 * 60 * 1000,
    robSuccessChance: 0.45,
    robMaxPercent: 0.25,
    bankInterest: { free: 0, premium: 0.02 }, // % ao dia sobre o valor no banco
    shopItemLimit: { free: 5, premium: 50 },
  },
};
