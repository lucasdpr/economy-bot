const { SlashCommandBuilder } = require('discord.js');
const economy = require('../db/economy');
const guilds = require('../db/guilds');
const { formatMoney } = require('../utils/format');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pagar')
    .setDescription('Transfere dinheiro da sua carteira para outra pessoa.')
    .addUserOption((opt) => opt.setName('usuario').setDescription('Quem vai receber').setRequired(true))
    .addIntegerOption((opt) =>
      opt.setName('quantia').setDescription('Quantia a transferir').setRequired(true).setMinValue(1)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('usuario');
    const amount = interaction.options.getInteger('quantia');
    const guild = guilds.getGuild(interaction.guildId);

    if (target.id === interaction.user.id) {
      return interaction.reply({ content: '❌ Você não pode pagar você mesmo.', ephemeral: true });
    }
    if (target.bot) {
      return interaction.reply({ content: '❌ Você não pode pagar um bot.', ephemeral: true });
    }

    try {
      economy.transfer(interaction.guildId, interaction.user.id, target.id, amount);
    } catch (err) {
      if (err.message === 'SALDO_INSUFICIENTE') {
        return interaction.reply({ content: '❌ Você não tem saldo suficiente na carteira.', ephemeral: true });
      }
      throw err;
    }

    await interaction.reply(`💸 Você pagou **${formatMoney(amount, guild)}** para <@${target.id}>.`);
  },
};
