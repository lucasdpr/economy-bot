const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const guilds = require('../db/guilds');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('premium')
    .setDescription('Veja ou gerencie o status Premium do servidor.')
    .addSubcommand((sub) => sub.setName('status').setDescription('Mostra o status Premium deste servidor.'))
    .addSubcommand((sub) =>
      sub
        .setName('ativar')
        .setDescription('(Dono do bot) Ativa o Premium em um servidor.')
        .addStringOption((opt) => opt.setName('servidor_id').setDescription('ID do servidor').setRequired(true))
        .addIntegerOption((opt) =>
          opt.setName('dias').setDescription('Duração em dias (deixe vazio para vitalício)').setRequired(false).setMinValue(1)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('desativar')
        .setDescription('(Dono do bot) Desativa o Premium de um servidor.')
        .addStringOption((opt) => opt.setName('servidor_id').setDescription('ID do servidor').setRequired(true))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'status') {
      const guild = guilds.getGuild(interaction.guildId);
      const embed = new EmbedBuilder()
        .setColor(guild?.premium ? 0xf5c518 : 0x99aab5)
        .setTitle(guild?.premium ? '✨ Este servidor tem Premium ativo' : '🔒 Este servidor está no plano Grátis')
        .setDescription(
          guild?.premium
            ? `Válido até: ${guild.premium_until ? `<t:${Math.floor(guild.premium_until / 1000)}:F>` : '**vitalício**'}`
            : `Com o Premium você desbloqueia:\n• Recompensas diárias e de trabalho maiores\n• Juros no banco\n• Loja com até ${config.economy.shopItemLimit.premium} itens\n• Nome e símbolo de moeda personalizados\n\nFale com quem administra este bot para ativar, ou veja o painel web.`
        )
        .setFooter({ text: `Painel: ${config.publicUrl}/g/${interaction.guildId}` });
      return interaction.reply({ embeds: [embed] });
    }

    if (interaction.user.id !== config.ownerId) {
      return interaction.reply({ content: '❌ Apenas o dono do bot pode fazer isso.', ephemeral: true });
    }

    const guildId = interaction.options.getString('servidor_id');

    if (sub === 'ativar') {
      const dias = interaction.options.getInteger('dias');
      guilds.ensureGuild(guildId);
      const g = guilds.activatePremium(guildId, dias);
      return interaction.reply({
        content: `✅ Premium ativado para o servidor \`${guildId}\`${dias ? ` por **${dias} dias**` : ' **vitalício**'}.`,
        ephemeral: true,
      });
    }

    if (sub === 'desativar') {
      guilds.deactivatePremium(guildId);
      return interaction.reply({ content: `✅ Premium desativado para o servidor \`${guildId}\`.`, ephemeral: true });
    }
  },
};
