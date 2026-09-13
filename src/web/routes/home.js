const express = require('express');
const guilds = require('../../db/guilds');
const { inviteUrl } = require('../../utils/invite');

module.exports = function () {
  const router = express.Router();

  router.get('/', (req, res) => {
    const client = req.client;
    const serverCount = client.guilds.cache.size;
    const userCount = client.guilds.cache.reduce((acc, g) => acc + (g.memberCount || 0), 0);
    const premiumCount = guilds.listGuilds().filter((g) => g.premium).length;

    res.render('home', {
      title: 'Bot de Economia',
      invite: inviteUrl(),
      serverCount,
      userCount,
      premiumCount,
    });
  });

  return router;
};
