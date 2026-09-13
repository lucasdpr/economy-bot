const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('painel')
    .setDescription('Mostra o link do painel web deste servidor.'),

  async execute(interaction) {
    const url = `${config.publicUrl}/g/${interaction.guildId}`;
    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('🌐 Painel Web')
      .setDescription(`Veja o ranking público deste servidor:\n${url}\n\nPara gerenciar a loja e configurações, acesse ${config.publicUrl}/dashboard e faça login com o Discord.`);
    await interaction.reply({ embeds: [embed] });
  },
};
