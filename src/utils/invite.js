const { PermissionsBitField } = require('discord.js');
const config = require('../config');

function inviteUrl() {
  const permissions = new PermissionsBitField([
    PermissionsBitField.Flags.ViewChannel,
    PermissionsBitField.Flags.SendMessages,
    PermissionsBitField.Flags.EmbedLinks,
    PermissionsBitField.Flags.UseExternalEmojis,
    PermissionsBitField.Flags.ManageRoles,
  ]).bitfield.toString();

  const params = new URLSearchParams({
    client_id: config.clientId,
    scope: 'bot applications.commands',
    permissions,
  });
  return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
}

module.exports = { inviteUrl };
