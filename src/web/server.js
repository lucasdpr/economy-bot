const path = require('path');
const express = require('express');
const session = require('express-session');
const config = require('../config');

function createServer(client) {
  const app = express();

  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, '..', '..', 'web', 'views'));
  app.use(express.static(path.join(__dirname, '..', '..', 'web', 'public')));
  app.use(express.urlencoded({ extended: true }));

  app.use(
    session({
      secret: config.sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 },
    })
  );

  // Deixa o client do bot disponível em req.client dentro das rotas
  app.use((req, res, next) => {
    req.client = client;
    res.locals.currentUser = req.session.user || null;
    res.locals.publicUrl = config.publicUrl;
    next();
  });

  app.use('/', require('./routes/home')());
  app.use('/auth', require('./routes/auth')());
  app.use('/dashboard', require('./routes/dashboard')());
  app.use('/g', require('./routes/public-guild')());
  app.use('/owner', require('./routes/owner')());

  app.use((req, res) => {
    res.status(404).render('404');
  });

  return app;
}

module.exports = createServer;
