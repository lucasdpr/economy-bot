const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Collection, ActivityType } = require('discord.js');
const config = require('./config');
const guilds = require('./db/guilds');
const economy = require('./db/economy');
const createServer = require('./web/server');

if (!config.token || !config.clientId) {
  console.error('❌ Defina DISCORD_TOKEN e CLIENT_ID no arquivo .env (veja .env.example).');
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
for (const file of fs.readdirSync(commandsPath).filter((f) => f.endsWith('.js'))) {
  const command = require(path.join(commandsPath, file));
  client.commands.set(command.data.name, command);
}

client.once('ready', () => {
  console.log(`✅ Bot online como ${client.user.tag} — em ${client.guilds.cache.size} servidor(es).`);
  for (const guild of client.guilds.cache.values()) {
    guilds.ensureGuild(guild.id, guild.name);
  }
  client.user.setPresence({
    activities: [{ name: '/ajuda | economia', type: ActivityType.Playing }],
    status: 'online',
  });

  // Juros diários no banco para servidores Premium (checagem a cada hora).
  setInterval(() => {
    for (const g of guilds.listGuilds()) {
      if (g.premium && config.economy.bankInterest.premium > 0) {
        economy.applyInterest(g.guild_id, config.economy.bankInterest.premium / 24);
      }
    }
  }, 60 * 60 * 1000);
});

client.on('guildCreate', (guild) => {
  guilds.ensureGuild(guild.id, guild.name);
});

client.on('interactionCreate', async (interaction) => {
  if (interaction.isAutocomplete()) {
    const command = client.commands.get(interaction.commandName);
    if (!command?.autocomplete) return;
    try {
      await command.autocomplete(interaction);
    } catch (err) {
      console.error(err);
    }
    return;
  }

  if (!interaction.isChatInputCommand()) return;
  if (!interaction.inGuild()) {
    return interaction.reply({ content: 'Este bot só funciona dentro de um servidor.', ephemeral: true });
  }

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  guilds.ensureGuild(interaction.guildId, interaction.guild?.name);

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(`Erro no comando /${interaction.commandName}:`, err);
    const payload = { content: '❌ Ocorreu um erro ao executar esse comando.', ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(payload).catch(() => {});
    } else {
      await interaction.reply(payload).catch(() => {});
    }
  }
});

client.login(config.token);

// Site (landing page pública, ranking público e painel de administração)
const app = createServer(client);
app.listen(config.port, () => {
  console.log(`🌐 Site rodando em ${config.publicUrl} (porta ${config.port})`);
});
