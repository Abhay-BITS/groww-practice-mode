export type Category = 'Stock' | 'Index Fund' | 'Mutual Fund' | 'Gold';
export type Risk = 'Low' | 'Moderate' | 'High';

export type Instrument = {
  id: string;
  name: string;
  short: string;
  category: Category;
  price: number;
  /** Sensitivity to the broad market. 1.0 moves with the index. */
  beta: number;
  /** Instrument-specific noise, as a daily standard deviation in percent. */
  idio: number;
  risk: Risk;
  /** One sentence a 21-year-old can read without looking anything up. */
  plain: string;
  /** The honest trade-off. Shown next to the upside, never hidden. */
  catch: string;
  color: string;
  sector: string;
};

/**
 * Nine instruments is enough to make allocation decisions meaningful without
 * turning Explore into a screener. Prices are indicative, not live.
 */
export const INSTRUMENTS: Instrument[] = [
  {
    id: 'reliance', name: 'Reliance Industries', short: 'RELIANCE', category: 'Stock',
    price: 2450, beta: 1.05, idio: 1.1, risk: 'High', sector: 'Energy', color: '#F2994A',
    plain: 'You own a sliver of one company. If it does well, you do well.',
    catch: 'One company. One bad quarter hits your whole position.',
  },
  {
    id: 'hdfc', name: 'HDFC Bank', short: 'HDFCBANK', category: 'Stock',
    price: 1680, beta: 1.15, idio: 1.0, risk: 'High', sector: 'Banking', color: '#5367FF',
    plain: 'A share of India’s largest private bank.',
    catch: 'Banks move hard when interest rates move. Expect swings.',
  },
  {
    id: 'infosys', name: 'Infosys', short: 'INFY', category: 'Stock',
    price: 1510, beta: 0.95, idio: 1.2, risk: 'High', sector: 'IT', color: '#E26A61',
    plain: 'An IT services company that earns most of its money abroad.',
    catch: 'A US slowdown shows up here before it shows up anywhere else.',
  },
  {
    id: 'tatamotors', name: 'Tata Motors', short: 'TATAMOTORS', category: 'Stock',
    price: 980, beta: 1.45, idio: 1.9, risk: 'High', sector: 'Auto', color: '#00B386',
    plain: 'Cars and trucks, in India and through Jaguar Land Rover.',
    catch: 'The most volatile name on this list. It can fall 8% in a week.',
  },
  {
    id: 'nifty50', name: 'Nifty 50 Index Fund', short: 'NIFTY 50', category: 'Index Fund',
    price: 218, beta: 1.0, idio: 0.12, risk: 'Moderate', sector: 'Diversified', color: '#00D09C',
    plain: 'One purchase buys a slice of India’s 50 largest listed companies.',
    catch: 'You will never beat the market, because you are the market.',
  },
  {
    id: 'next50', name: 'Nifty Next 50 Index Fund', short: 'NEXT 50', category: 'Index Fund',
    price: 162, beta: 1.2, idio: 0.2, risk: 'Moderate', sector: 'Diversified', color: '#2F9CDB',
    plain: 'The 50 companies sitting just behind the Nifty 50.',
    catch: 'More growth on the way up, more pain on the way down.',
  },
  {
    id: 'largecap', name: 'Large Cap Fund', short: 'LARGE CAP', category: 'Mutual Fund',
    price: 74, beta: 0.92, idio: 0.3, risk: 'Moderate', sector: 'Diversified', color: '#9F7AEA',
    plain: 'A fund manager picks established companies on your behalf.',
    catch: 'You pay a fee for that judgement, whether it works or not.',
  },
  {
    id: 'hybrid', name: 'Balanced Hybrid Fund', short: 'HYBRID', category: 'Mutual Fund',
    price: 42, beta: 0.55, idio: 0.2, risk: 'Low', sector: 'Equity + Debt', color: '#50AA9D',
    plain: 'Part equity, part bonds. A steadier ride than pure equity.',
    catch: 'Steadier on the way down also means slower on the way up.',
  },
  {
    id: 'gold', name: 'Gold ETF', short: 'GOLDBEES', category: 'Gold',
    price: 58, beta: -0.15, idio: 0.6, risk: 'Moderate', sector: 'Commodity', color: '#E6B33C',
    plain: 'Gold you can buy in rupees without storing anything.',
    catch: 'Gold earns nothing. It only moves on what people will pay for it.',
  },
];

export const byId = (id: string) => INSTRUMENTS.find((i) => i.id === id)!;

/** Terms we underline anywhere in the app. Tap gives one sentence, no jargon inside the jargon. */
export const GLOSSARY: Record<string, string> = {
  diversification: 'Spreading money across different investments so that no single one decides your outcome.',
  allocation: 'How your money is split across what you own, usually written as percentages.',
  volatility: 'How much a price swings around. High volatility means big moves in both directions.',
  drawdown: 'The fall from the highest value your portfolio has reached to its lowest point since.',
  sip: 'A fixed amount invested automatically on the same date every month.',
  index: 'A fixed list of companies used to represent a market, like the Nifty 50.',
  equity: 'Another word for shares in companies.',
  beta: 'How strongly something moves compared to the overall market.',
  horizon: 'How long you plan to stay invested before you need the money.',
  expense: 'The yearly fee a fund charges you, taken out of your returns.',
};
