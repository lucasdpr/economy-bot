const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');
const config = require('./config');

if (!config.token || !config.clientId) {
  console.error('❌ Defina DISCORD_TOKEN e CLIENT_ID no arquivo .env antes de registrar os comandos.');
  process.exit(1);
}

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
for (const file of fs.readdirSync(commandsPath).filter((f) => f.endsWith('.js'))) {
  const command = require(path.join(commandsPath, file));
  commands.push(command.data.toJSON());
}

const rest = new REST().setToken(config.token);

(async () => {
  try {
    const route = config.guildId
      ? Routes.applicationGuildCommands(config.clientId, config.guildId)
      : Routes.applicationCommands(config.clientId);

    console.log(`🔄 Registrando ${commands.length} comandos ${config.guildId ? `no servidor ${config.guildId} (instantâneo)` : 'globalmente (leva até 1h para propagar)'}...`);
    await rest.put(route, { body: commands });
    console.log('✅ Comandos registrados com sucesso.');
  } catch (err) {
    console.error('❌ Falha ao registrar comandos:', err);
    process.exit(1);
  }
})();
