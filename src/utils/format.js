function formatMoney(amount, guild) {
  const symbol = guild?.currency_symbol || '🪙';
  const num = Number(amount || 0).toLocaleString('pt-BR');
  return `${num} ${symbol}`;
}

function formatDuration(ms) {
  if (ms <= 0) return '0s';
  const totalSeconds = Math.ceil(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const parts = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (s > 0 && h === 0) parts.push(`${s}s`);
  return parts.join(' ') || '0s';
}

module.exports = { formatMoney, formatDuration };
