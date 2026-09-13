const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const economy = require('../db/economy');
const guilds = require('../db/guilds');
const { formatMoney } = require('../utils/format');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('banco')
    .setDescription('Deposite ou saque dinheiro do seu banco (o banco é protegido contra roubo).')
    .addSubcommand((sub) =>
      sub
        .setName('depositar')
        .setDescription('Deposita dinheiro da carteira no banco.')
        .addIntegerOption((opt) =>
          opt.setName('quantia').setDescription('Quantia a depositar').setRequired(true).setMinValue(1)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('sacar')
        .setDescription('Saca dinheiro do banco para a carteira.')
        .addIntegerOption((opt) =>
          opt.setName('quantia').setDescription('Quantia a sacar').setRequired(true).setMinValue(1)
        )
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const amount = interaction.options.getInteger('quantia');
    const guild = guilds.getGuild(interaction.guildId);
    economy.getOrCreateUser(interaction.guildId, interaction.user.id, interaction.user.username);

    if (sub === 'depositar') {
      const result = economy.deposit(interaction.guildId, interaction.user.id, amount);
      if (!result.ok) return interaction.reply({ content: '❌ Você não tem esse valor na carteira.', ephemeral: true });
      return interaction.reply({ content: `🏦 Você depositou **${formatMoney(amount, guild)}** no banco.` });
    }

    const result = economy.withdraw(interaction.guildId, interaction.user.id, amount);
    if (!result.ok) return interaction.reply({ content: '❌ Você não tem esse valor no banco.', ephemeral: true });
    return interaction.reply({ content: `🏧 Você sacou **${formatMoney(amount, guild)}** do banco.` });
  },
};
