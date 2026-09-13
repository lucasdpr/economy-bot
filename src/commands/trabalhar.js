const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const economy = require('../db/economy');
const guilds = require('../db/guilds');
const config = require('../config');
const { formatMoney, formatDuration } = require('../utils/format');

const FRASES = [
  'Você entregou umas encomendas e faturou',
  'Você ajudou num freela de programação e recebeu',
  'Você trabalhou como garçom no fim de semana e ganhou',
  'Você vendeu artesanato na feira e lucrou',
  'Você fez uns bicos e recebeu',
  'Você deu aula particular e ganhou',
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('trabalhar')
    .setDescription('Trabalhe para ganhar uma quantia aleatória de dinheiro.'),

  async execute(interaction) {
    const guild = guilds.getGuild(interaction.guildId);
    const [min, max] = guild?.premium ? config.economy.workRange.premium : config.economy.workRange.free;
    const result = economy.claimWork(interaction.guildId, interaction.user.id, min, max);

    if (!result.ok) {
      return interaction.reply({
        content: `⏳ Você está cansado. Tente trabalhar de novo em **${formatDuration(result.remainingMs)}**.`,
        ephemeral: true,
      });
    }

    const frase = FRASES[Math.floor(Math.random() * FRASES.length)];
    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setDescription(`💼 ${frase} **${formatMoney(result.amount, guild)}**!`);

    await interaction.reply({ embeds: [embed] });
  },
};
