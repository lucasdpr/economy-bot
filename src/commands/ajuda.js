const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('ajuda').setDescription('Lista todos os comandos do bot.'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('📖 Comandos')
      .addFields(
        {
          name: '💰 Economia',
          value: '`/saldo` `/diario` `/trabalhar` `/pagar` `/roubar` `/banco depositar` `/banco sacar` `/ranking`',
        },
        {
          name: '🛒 Loja',
          value: '`/loja listar` `/loja comprar` `/inventario`\nAdmin: `/loja adicionar` `/loja remover`',
        },
        {
          name: '⚙️ Servidor',
          value: '`/configurar moeda` (Premium) • `/premium status` • `/painel`',
        }
      );
    await interaction.reply({ embeds: [embed] });
  },
};
