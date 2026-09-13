const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const economy = require('../db/economy');
const guilds = require('../db/guilds');
const config = require('../config');
const { formatMoney, formatDuration } = require('../utils/format');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('diario')
    .setDescription('Resgata sua recompensa diária.'),

  async execute(interaction) {
    const guild = guilds.getGuild(interaction.guildId);
    const amount = guild?.premium ? config.economy.dailyAmount.premium : config.economy.dailyAmount.free;
    const result = economy.claimDaily(interaction.guildId, interaction.user.id, amount);

    if (!result.ok) {
      return interaction.reply({
        content: `⏳ Você já resgatou hoje. Volte em **${formatDuration(result.remainingMs)}**.`,
        ephemeral: true,
      });
    }

    const embed = new EmbedBuilder()
      .setColor(0x57f287)
      .setDescription(`✅ Você recebeu **${formatMoney(result.amount, guild)}** de recompensa diária!${guild?.premium ? '\n✨ Bônus Premium aplicado.' : ''}`);

    await interaction.reply({ embeds: [embed] });
  },
};
