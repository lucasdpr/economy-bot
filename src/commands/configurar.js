const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const guilds = require('../db/guilds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('configurar')
    .setDescription('Configurações da economia do servidor.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName('moeda')
        .setDescription('(Premium) Personaliza o nome e o símbolo da moeda do servidor.')
        .addStringOption((opt) => opt.setName('nome').setDescription('Nome da moeda, ex: Créditos').setRequired(true))
        .addStringOption((opt) => opt.setName('simbolo').setDescription('Emoji ou símbolo, ex: 💎').setRequired(true))
    ),

  async execute(interaction) {
    const guild = guilds.getGuild(interaction.guildId);

    if (!guild?.premium) {
      return interaction.reply({
        content:
          '✨ Personalizar a moeda é um recurso **Premium**. Use `/premium status` para ver como ativar no seu servidor.',
        ephemeral: true,
      });
    }

    const nome = interaction.options.getString('nome').slice(0, 32);
    const simbolo = interaction.options.getString('simbolo').slice(0, 8);
    guilds.setCurrency(interaction.guildId, nome, simbolo);

    await interaction.reply(`✅ Moeda deste servidor atualizada para **${nome}** (${simbolo}).`);
  },
};
