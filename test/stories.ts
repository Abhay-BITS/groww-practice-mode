import { TRADING_DAYS, type MarketPath } from '@/lib/market';

/**
 * The story each modelled year has to tell. A seed that breaks one of these
 * would teach a beginner something false, so they are enforced in the tests
 * rather than eyeballed once.
 */
const ret = (p: MarketPath, id: string, d: number) => p.prices[id][d] / p.prices[id][0] - 1;
const STOCKS = ['reliance', 'hdfc', 'infosys'];

export const STORIES: Record<string, (p: MarketPath) => [string, boolean][]> = {
  crash2020: (p) => {
    const b = p.bottomDay, e = TRADING_DAYS;
    return [
      ['at the bottom, Tata Motors has fallen furthest', ret(p, 'tatamotors', b) < ret(p, 'next50', b)],
      ['at the bottom, Next 50 has fallen more than Nifty 50', ret(p, 'next50', b) < ret(p, 'nifty50', b)],
      ['at the bottom, Nifty 50 has fallen more than the hybrid fund', ret(p, 'nifty50', b) < ret(p, 'hybrid', b)],
      ['at the bottom, every single stock is below the hybrid fund', STOCKS.every((id) => ret(p, id, b) < ret(p, 'hybrid', b))],
      ['at the bottom, gold is up', ret(p, 'gold', b) > 0],
      ['gold finishes the year up more than 5%', ret(p, 'gold', e) > 0.05],
      ['Nifty 50 finishes the year up', ret(p, 'nifty50', e) > 0],
    ];
  },
  grind2022: (p) => {
    const b = p.bottomDay;
    return [
      ['at the dip, Tata Motors is below Nifty 50', ret(p, 'tatamotors', b) < ret(p, 'nifty50', b)],
      ['at the dip, Nifty 50 is below the hybrid fund', ret(p, 'nifty50', b) < ret(p, 'hybrid', b)],
      ['at the dip, every single stock is below the hybrid fund', STOCKS.every((id) => ret(p, id, b) < ret(p, 'hybrid', b))],
    ];
  },
  calm2017: (p) => {
    const e = TRADING_DAYS;
    return [
      ['Tata Motors beats Nifty 50', ret(p, 'tatamotors', e) > ret(p, 'nifty50', e)],
      ['Nifty 50 beats the hybrid fund', ret(p, 'nifty50', e) > ret(p, 'hybrid', e)],
      ['the hybrid fund is still up', ret(p, 'hybrid', e) > 0],
      ['every single stock is up more than 10%', STOCKS.every((id) => ret(p, id, e) > 0.1)],
    ];
  },
};
