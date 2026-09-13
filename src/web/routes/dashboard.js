const express = require('express');
const guilds = require('../../db/guilds');
const shop = require('../../db/shop');
const economy = require('../../db/economy');
const config = require('../../config');

function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect(`/auth/login?redirect=${encodeURIComponent(req.originalUrl)}`);
  }
  next();
}

/** Garante que o usuário logado administra este servidor e que o bot está nele. */
function requireGuildAccess(req, res, next) {
  const { guildId } = req.params;
  const managed = (req.session.manageableGuilds || []).find((g) => g.id === guildId);
  const botGuild = req.client.guilds.cache.get(guildId);

  if (!botGuild) {
    return res.status(404).render('error', { message: 'O bot não está nesse servidor.' });
  }
  if (!managed) {
    return res.status(403).render('error', { message: 'Você não tem permissão de administrador nesse servidor.' });
  }
  req.botGuild = botGuild;
  next();
}

module.exports = function () {
  const router = express.Router();
  router.use(requireLogin);

  router.get('/', (req, res) => {
    const managed = req.session.manageableGuilds || [];
    const list = managed.map((g) => ({
      ...g,
      botPresent: req.client.guilds.cache.has(g.id),
    }));
    res.render('dashboard-guilds', { title: 'Meus servidores', guilds: list, inviteBase: 'https://discord.com/api/oauth2/authorize' });
  });

  router.get('/:guildId', requireGuildAccess, (req, res) => {
    const guildId = req.params.guildId;
    const guildRow = guilds.ensureGuild(guildId, req.botGuild.name);
    const items = shop.listItems(guildId);
    const top = economy.leaderboard(guildId, 10);
    const limit = guilds.shopLimitFor(guildId);

    res.render('dashboard-guild', {
      title: req.botGuild.name,
      botGuild: req.botGuild,
      guildRow,
      items,
      top,
      shopLimit: limit,
      publicUrl: config.publicUrl,
      saved: req.query.saved || null,
    });
  });

  router.post('/:guildId/settings', requireGuildAccess, (req, res) => {
    const guildId = req.params.guildId;
    const guildRow = guilds.getGuild(guildId);
    if (!guildRow?.premium) {
      return res.status(403).render('error', { message: 'Personalizar a moeda é um recurso Premium.' });
    }
    const nome = String(req.body.currency_name || 'moeda').slice(0, 32);
    const simbolo = String(req.body.currency_symbol || '🪙').slice(0, 8);
    guilds.setCurrency(guildId, nome, simbolo);
    res.redirect(`/dashboard/${guildId}?saved=1`);
  });

  router.post('/:guildId/shop/add', requireGuildAccess, (req, res) => {
    const guildId = req.params.guildId;
    const limit = guilds.shopLimitFor(guildId);
    const current = shop.itemCount(guildId);

    if (current >= limit) {
      return res.status(403).render('error', {
        message: `Limite de ${limit} itens atingido. Ative o Premium para aumentar o limite da loja.`,
      });
    }

    const name = String(req.body.name || '').trim().slice(0, 64);
    const price = Math.max(1, parseInt(req.body.price, 10) || 0);
    const description = String(req.body.description || '').slice(0, 200);
    const roleId = req.body.role_id ? String(req.body.role_id).trim() : null;
    const stockRaw = parseInt(req.body.stock, 10);
    const stock = Number.isFinite(stockRaw) && stockRaw > 0 ? stockRaw : -1;

    if (!name || !price) {
      return res.status(400).render('error', { message: 'Nome e preço do item são obrigatórios.' });
    }

    shop.addItem(guildId, { name, price, description, roleId, stock });
    res.redirect(`/dashboard/${guildId}?saved=1`);
  });

  router.post('/:guildId/shop/remove/:itemId', requireGuildAccess, (req, res) => {
    shop.removeItem(req.params.guildId, Number(req.params.itemId));
    res.redirect(`/dashboard/${req.params.guildId}?saved=1`);
  });

  return router;
};
