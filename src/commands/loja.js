const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const shop = require('../db/shop');
const economy = require('../db/economy');
const guilds = require('../db/guilds');
const { formatMoney } = require('../utils/format');

function isManager(interaction) {
  return interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('loja')
    .setDescription('Loja de itens do servidor.')
    .addSubcommand((sub) => sub.setName('listar').setDescription('Lista os itens à venda.'))
    .addSubcommand((sub) =>
      sub
        .setName('comprar')
        .setDescription('Compra um item da loja.')
        .addStringOption((opt) =>
          opt.setName('item').setDescription('Item que você quer comprar').setRequired(true).setAutocomplete(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('adicionar')
        .setDescription('(Admin) Adiciona um item à loja.')
        .addStringOption((opt) => opt.setName('nome').setDescription('Nome do item').setRequired(true))
        .addIntegerOption((opt) => opt.setName('preco').setDescription('Preço do item').setRequired(true).setMinValue(1))
        .addStringOption((opt) => opt.setName('descricao').setDescription('Descrição do item').setRequired(false))
        .addRoleOption((opt) => opt.setName('cargo').setDescription('Cargo dado ao comprar (opcional)').setRequired(false))
        .addIntegerOption((opt) =>
          opt.setName('estoque').setDescription('Estoque limitado (deixe vazio para ilimitado)').setRequired(false).setMinValue(1)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('remover')
        .setDescription('(Admin) Remove um item da loja.')
        .addStringOption((opt) =>
          opt.setName('item').setDescription('Item a remover').setRequired(true).setAutocomplete(true)
        )
    ),

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused().toLowerCase();
    const items = shop.listItems(interaction.guildId);
    const filtered = items
      .filter((i) => i.name.toLowerCase().includes(focused))
      .slice(0, 25)
      .map((i) => ({ name: `${i.name} (${i.price})`, value: String(i.id) }));
    await interaction.respond(filtered);
  },

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guild = guilds.getGuild(interaction.guildId);

    if (sub === 'listar') {
      const items = shop.listItems(interaction.guildId);
      if (items.length === 0) {
        return interaction.reply('A loja deste servidor ainda está vazia.');
      }
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle(`🛒 Loja de ${interaction.guild.name}`)
        .setDescription(
          items
            .map((i) => {
              const estoque = i.stock < 0 ? 'ilimitado' : `${i.stock} restante(s)`;
              const cargo = i.role_id ? ` • dá o cargo <@&${i.role_id}>` : '';
              return `**#${i.id} — ${i.name}** — ${formatMoney(i.price, guild)}\n${i.description || ''}${cargo}\n_Estoque: ${estoque}_`;
            })
            .join('\n\n')
        );
      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'comprar') {
      const itemId = Number(interaction.options.getString('item'));
      const item = shop.getItem(interaction.guildId, itemId);
      if (!item) return interaction.reply({ content: '❌ Item não encontrado.', ephemeral: true });

      const user = economy.getOrCreateUser(interaction.guildId, interaction.user.id, interaction.user.username);
      if (user.balance < item.price) {
        return interaction.reply({ content: '❌ Você não tem saldo suficiente na carteira.', ephemeral: true });
      }

      const result = shop.buyItem(interaction.guildId, interaction.user.id, itemId);
      if (!result.ok) {
        return interaction.reply({ content: '❌ Este item está fora de estoque.', ephemeral: true });
      }
      economy.setBalance(interaction.guildId, interaction.user.id, user.balance - item.price);

      if (item.role_id) {
        try {
          await interaction.member.roles.add(item.role_id);
        } catch {
          // Bot sem permissão para atribuir o cargo — item ainda vai pro inventário.
        }
      }

      return interaction.reply(`✅ Você comprou **${item.name}** por ${formatMoney(item.price, guild)}!`);
    }

    // adicionar / remover — restrito a quem gerencia o servidor
    if (!isManager(interaction)) {
      return interaction.reply({ content: '❌ Você precisa de permissão de **Gerenciar Servidor** para isso.', ephemeral: true });
    }

    if (sub === 'adicionar') {
      const limit = guilds.shopLimitFor(interaction.guildId);
      const current = shop.itemCount(interaction.guildId);
      if (current >= limit) {
        return interaction.reply({
          content: `❌ Limite de **${limit} itens** atingido no plano ${guild?.premium ? 'Premium' : 'Grátis'}. ${
            guild?.premium ? '' : 'Ative o Premium para aumentar o limite — use `/premium status` para saber mais.'
          }`,
          ephemeral: true,
        });
      }
      const name = interaction.options.getString('nome');
      const price = interaction.options.getInteger('preco');
      const description = interaction.options.getString('descricao') || '';
      const role = interaction.options.getRole('cargo');
      const stock = interaction.options.getInteger('estoque') ?? -1;

      const item = shop.addItem(interaction.guildId, { name, price, description, roleId: role?.id || null, stock });
      return interaction.reply(`✅ Item **#${item.id} — ${item.name}** adicionado à loja por ${formatMoney(price, guild)}.`);
    }

    if (sub === 'remover') {
      const itemId = Number(interaction.options.getString('item'));
      const ok = shop.removeItem(interaction.guildId, itemId);
      return interaction.reply(ok ? '✅ Item removido da loja.' : '❌ Item não encontrado.');
    }
  },
};
