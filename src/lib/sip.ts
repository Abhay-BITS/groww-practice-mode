/** Most mutual fund SIPs start at ₹100 a month per fund. */
export const MIN_PER_FUND = 100;

/**
 * Split a monthly amount across the funds the user practised with, in
 * proportion to how much they held. Any fund that would get less than the
 * minimum is dropped and the rest re-split, smallest first. Without this, a
 * ₹100 SIP across three funds comes out at ₹33 each, which no fund accepts.
 */
export function splitSip(amount: number, funds: { id: string; value: number }[]) {
  let pool = [...funds].sort((a, b) => b.value - a.value);
  while (pool.length > 1) {
    const total = pool.reduce((t, f) => t + f.value, 0);
    const smallest = pool[pool.length - 1];
    if ((smallest.value / total) * amount >= MIN_PER_FUND) break;
    pool = pool.slice(0, -1);
  }
  const total = pool.reduce((t, f) => t + f.value, 0) || 1;
  const parts = pool.map((f) => ({ id: f.id, amount: Math.floor(((f.value / total) * amount) / 10) * 10 }));
  if (parts.length) parts[0].amount += amount - parts.reduce((t, p) => t + p.amount, 0);
  return { parts, dropped: funds.length - pool.length };
}
