const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const economy = require('../db/economy');
const guilds = require('../db/guilds');
const { formatMoney } = require('../utils/format');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('saldo')
    .setDescription('Mostra seu saldo (ou de outra pessoa) na economia do servidor.')
    .addUserOption((opt) =>
      opt.setName('usuario').setDescription('Ver o saldo de outra pessoa').setRequired(false)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('usuario') || interaction.user;
    const guild = guilds.getGuild(interaction.guildId);
    const user = economy.getOrCreateUser(interaction.guildId, target.id, target.username);

    const embed = new EmbedBuilder()
      .setColor(guild?.premium ? 0xf5c518 : 0x5865f2)
      .setAuthor({ name: target.username, iconURL: target.displayAvatarURL() })
      .setTitle('💰 Carteira')
      .addFields(
        { name: 'Carteira', value: formatMoney(user.balance, guild), inline: true },
        { name: 'Banco', value: formatMoney(user.bank, guild), inline: true },
        { name: 'Total', value: formatMoney(user.balance + user.bank, guild), inline: true }
      );

    await interaction.reply({ embeds: [embed] });
  },
};
