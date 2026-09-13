const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const shop = require('../db/shop');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('inventario')
    .setDescription('Mostra os itens que você (ou outra pessoa) já comprou.')
    .addUserOption((opt) => opt.setName('usuario').setDescription('Ver o inventário de outra pessoa').setRequired(false)),

  async execute(interaction) {
    const target = interaction.options.getUser('usuario') || interaction.user;
    const items = shop.getInventory(interaction.guildId, target.id);

    if (items.length === 0) {
      return interaction.reply({ content: `${target.id === interaction.user.id ? 'Você' : 'Essa pessoa'} ainda não tem itens.`, ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setAuthor({ name: target.username, iconURL: target.displayAvatarURL() })
      .setTitle('🎒 Inventário')
      .setDescription(items.map((i) => `**${i.name}** x${i.quantity}${i.description ? ` — _${i.description}_` : ''}`).join('\n'));

    await interaction.reply({ embeds: [embed] });
  },
};
