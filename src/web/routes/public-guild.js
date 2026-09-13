const express = require('express');
const guilds = require('../../db/guilds');
const economy = require('../../db/economy');
const shop = require('../../db/shop');

module.exports = function () {
  const router = express.Router();

  router.get('/:guildId', (req, res) => {
    const { guildId } = req.params;
    const botGuild = req.client.guilds.cache.get(guildId);
    if (!botGuild) {
      return res.status(404).render('error', { message: 'Servidor não encontrado ou o bot não está nele.' });
    }

    const guildRow = guilds.ensureGuild(guildId, botGuild.name);
    const top = economy.leaderboard(guildId, 10);
    const items = shop.listItems(guildId);

    // Resolve nomes de usuário via cache do Discord quando disponível
    const topWithNames = top.map((u) => {
      const member = botGuild.members.cache.get(u.user_id);
      return { ...u, displayName: member?.displayName || member?.user?.username || `Usuário ${u.user_id.slice(-4)}` };
    });

    res.render('public-guild', {
      title: botGuild.name,
      botGuild,
      guildRow,
      top: topWithNames,
      items,
    });
  });

  return router;
};
