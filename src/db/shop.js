const db = require('./index');

const insertItem = db.prepare(`
  INSERT INTO shop_items (guild_id, name, price, description, role_id, stock)
  VALUES (@guild_id, @name, @price, @description, @role_id, @stock)
`);
const selectItems = db.prepare('SELECT * FROM shop_items WHERE guild_id = ? ORDER BY price ASC');
const selectItem = db.prepare('SELECT * FROM shop_items WHERE guild_id = ? AND id = ?');
const countItems = db.prepare('SELECT COUNT(*) AS n FROM shop_items WHERE guild_id = ?');
const deleteItem = db.prepare('DELETE FROM shop_items WHERE guild_id = ? AND id = ?');
const decrementStock = db.prepare('UPDATE shop_items SET stock = stock - 1 WHERE guild_id = ? AND id = ? AND stock > 0');

const upsertInventory = db.prepare(`
  INSERT INTO inventory (guild_id, user_id, item_id, quantity)
  VALUES (?, ?, ?, 1)
  ON CONFLICT(guild_id, user_id, item_id) DO UPDATE SET quantity = quantity + 1
`);
const selectInventory = db.prepare(`
  SELECT inventory.item_id, inventory.quantity, shop_items.name, shop_items.description
  FROM inventory
  JOIN shop_items ON shop_items.id = inventory.item_id AND shop_items.guild_id = inventory.guild_id
  WHERE inventory.guild_id = ? AND inventory.user_id = ?
  ORDER BY shop_items.name ASC
`);

function listItems(guildId) {
  return selectItems.all(guildId);
}

function getItem(guildId, itemId) {
  return selectItem.get(guildId, itemId) || null;
}

function itemCount(guildId) {
  return countItems.get(guildId).n;
}

function addItem(guildId, { name, price, description = '', roleId = null, stock = -1 }) {
  const info = insertItem.run({
    guild_id: guildId,
    name,
    price,
    description,
    role_id: roleId,
    stock,
  });
  return getItem(guildId, info.lastInsertRowid);
}

function removeItem(guildId, itemId) {
  const info = deleteItem.run(guildId, itemId);
  return info.changes > 0;
}

/** Retorna 'SEM_ESTOQUE' | 'OK' */
function buyItem(guildId, userId, itemId) {
  const item = getItem(guildId, itemId);
  if (!item) return { ok: false, reason: 'ITEM_NAO_ENCONTRADO' };
  if (item.stock === 0) return { ok: false, reason: 'SEM_ESTOQUE' };
  if (item.stock > 0) decrementStock.run(guildId, itemId);
  upsertInventory.run(guildId, userId, itemId);
  return { ok: true, item };
}

function getInventory(guildId, userId) {
  return selectInventory.all(guildId, userId);
}

module.exports = {
  listItems,
  getItem,
  itemCount,
  addItem,
  removeItem,
  buyItem,
  getInventory,
};
