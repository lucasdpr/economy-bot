const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const economy = require('../db/economy');
const guilds = require('../db/guilds');
const { formatMoney } = require('../utils/format');

const MEDALHAS = ['🥇', '🥈', '🥉'];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ranking')
    .setDescription('Mostra os 10 mais ricos do servidor.'),

  async execute(interaction) {
    const guild = guilds.getGuild(interaction.guildId);
    const top = economy.leaderboard(interaction.guildId, 10);

    if (top.length === 0) {
      return interaction.reply({ content: 'Ainda não há ninguém na economia deste servidor.', ephemeral: true });
    }

    const lines = top.map((u, i) => {
      const medal = MEDALHAS[i] || `${i + 1}.`;
      return `${medal} <@${u.user_id}> — **${formatMoney(u.balance + u.bank, guild)}**`;
    });

    const embed = new EmbedBuilder()
      .setColor(0xf5c518)
      .setTitle(`🏆 Ranking de ${interaction.guild.name}`)
      .setDescription(lines.join('\n'));

    await interaction.reply({ embeds: [embed] });
  },
};
