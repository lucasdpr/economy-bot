const express = require('express');
const guilds = require('../../db/guilds');
const config = require('../../config');

function requireOwner(req, res, next) {
  if (!req.session.user) {
    return res.redirect(`/auth/login?redirect=${encodeURIComponent(req.originalUrl)}`);
  }
  if (!config.ownerId || req.session.user.id !== config.ownerId) {
    return res.status(403).render('error', { message: 'Área restrita ao dono do bot.' });
  }
  next();
}

module.exports = function () {
  const router = express.Router();
  router.use(requireOwner);

  router.get('/', (req, res) => {
    const client = req.client;
    const rows = guilds.listGuilds().map((g) => {
      const botGuild = client.guilds.cache.get(g.guild_id);
      return {
        ...g,
        memberCount: botGuild?.memberCount || 0,
        present: Boolean(botGuild),
      };
    });
    res.render('owner', { title: 'Painel do dono', rows, saved: req.query.saved || null });
  });

  router.post('/:guildId/premium', (req, res) => {
    const { guildId } = req.params;
    const action = req.body.action;
    const days = parseInt(req.body.days, 10);

    if (action === 'activate') {
      guilds.activatePremium(guildId, Number.isFinite(days) && days > 0 ? days : null);
    } else if (action === 'deactivate') {
      guilds.deactivatePremium(guildId);
    }
    res.redirect('/owner?saved=1');
  });

  return router;
};
