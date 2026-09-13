const express = require('express');
const crypto = require('crypto');
const oauth = require('../oauth');

module.exports = function () {
  const router = express.Router();

  router.get('/login', (req, res) => {
    const state = crypto.randomBytes(16).toString('hex');
    req.session.oauthState = state;
    const redirectTo = typeof req.query.redirect === 'string' ? req.query.redirect : '/dashboard';
    req.session.postLoginRedirect = redirectTo.startsWith('/') ? redirectTo : '/dashboard';
    res.redirect(oauth.loginUrl(state));
  });

  router.get('/callback', async (req, res) => {
    const { code, state } = req.query;
    if (!code || !state || state !== req.session.oauthState) {
      return res.status(400).render('error', { message: 'Login inválido ou expirado. Tente novamente.' });
    }

    try {
      const token = await oauth.exchangeCode(code);
      const [user, userGuilds] = await Promise.all([
        oauth.fetchUser(token.access_token),
        oauth.fetchUserGuilds(token.access_token),
      ]);

      req.session.user = {
        id: user.id,
        username: user.global_name || user.username,
        avatar: user.avatar
          ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
          : `https://cdn.discordapp.com/embed/avatars/${Number(user.discriminator || 0) % 5}.png`,
      };
      req.session.manageableGuilds = userGuilds.filter(oauth.canManage).map((g) => ({ id: g.id, name: g.name, icon: g.icon }));

      const redirectTo = req.session.postLoginRedirect || '/dashboard';
      delete req.session.postLoginRedirect;
      delete req.session.oauthState;
      res.redirect(redirectTo);
    } catch (err) {
      console.error('Erro no login OAuth2:', err);
      res.status(500).render('error', { message: 'Não foi possível concluir o login com o Discord.' });
    }
  });

  router.get('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/'));
  });

  return router;
};
