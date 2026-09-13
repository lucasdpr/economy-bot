const { SlashCommandBuilder } = require('discord.js');
const economy = require('../db/economy');
const guilds = require('../db/guilds');
const { formatMoney, formatDuration } = require('../utils/format');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('roubar')
    .setDescription('Tenta roubar dinheiro da carteira de outra pessoa (arriscado!).')
    .addUserOption((opt) => opt.setName('usuario').setDescription('Quem você quer roubar').setRequired(true)),

  async execute(interaction) {
    const target = interaction.options.getUser('usuario');
    const guild = guilds.getGuild(interaction.guildId);

    if (target.id === interaction.user.id || target.bot) {
      return interaction.reply({ content: '❌ Alvo inválido.', ephemeral: true });
    }

    const result = economy.attemptRob(interaction.guildId, interaction.user.id, target.id);

    if (!result.ok) {
      if (result.reason === 'COOLDOWN') {
        return interaction.reply({
          content: `⏳ Você precisa esperar **${formatDuration(result.remainingMs)}** para tentar roubar de novo.`,
          ephemeral: true,
        });
      }
      return interaction.reply({ content: '❌ Esse alvo não tem dinheiro na carteira para roubar.', ephemeral: true });
    }

    if (result.success) {
      return interaction.reply(
        `🕵️ Você roubou **${formatMoney(result.amount, guild)}** de <@${target.id}>!`
      );
    }

    return interaction.reply(
      `🚨 Você foi pego tentando roubar <@${target.id}> e pagou uma multa de **${formatMoney(result.fine, guild)}**.`
    );
  },
};
