import { byId } from '@/data/instruments';
import { overall, traits, type Snapshot } from '@/lib/dna';
import type { GameState } from '@/lib/types';

export type Guard = 'no-recommendation' | 'no-guarantee' | 'no-prediction' | 'no-instruction' | 'injection' | 'chasing' | 'off-topic';

export type CoachReply = {
  text: string;
  /** Which guardrail fired, if any. Shown in the UI, and checked by the eval set. */
  guard?: Guard;
};

/**
 * Intents, checked in this order. Refusals come before answers, so "which index
 * fund should I buy" is treated as a request for a pick, not a question about
 * index funds.
 *
 * The first version matched single phrases and scored 4 out of 16 on prompts
 * worded differently from the ones it was written against. Each intent is now a
 * family of patterns; the eval set in test/coach.cases.ts keeps it honest. In a
 * production build this list becomes the test set for an LLM classifier, not
 * the classifier itself.
 */
const INTENTS: [Guard, RegExp[]][] = [
  ['injection', [
    /ignore (all |any |your |the )?(previous |prior |above )?(instructions|rules|prompt)/,
    /\byou are now\b/, /\bpretend\b/, /\bact as\b/, /\broleplay\b/, /\bdisregard\b/, /\bjailbreak\b/,
    /rules (do not|don't|dont) apply/, /developer mode/,
  ]],
  ['no-guarantee', [
    /guarantee/, /\bassured\b/, /risk[- ]?free/, /\b100 ?% safe\b/, /\b(completely|totally|fully) safe\b/,
    /can'?t lose/, /\bno risk\b/, /sure[- ]?shot/, /\bis (it|this) safe\b/, /\bsafe to invest\b/,
  ]],
  ['chasing', [
    /\b\d+ ?x\b/, /double (my|the) money/, /multi ?bagger/, /\bnext big\b/, /find the next/, /get rich/,
    /quick (money|profit|returns?)/, /penny stock/, /hot (stock|tip)/, /\btips?\b.*\b(stock|share|trade)/,
  ]],
  ['no-prediction', [
    /\b(will|is|are|would)\b.{0,40}\b(go up|go down|rise|fall|crash|recover|rally|moon|bounce)\b/,
    /going to (crash|rise|fall|go up|go down|recover)/, /where will/, /\bby (diwali|next|the end of|end of|december)\b/,
    /target price/, /predict/, /forecast/, /next (week|month|year)\b/, /what will .{0,30}(price|nifty|market|sensex)/,
  ]],
  ['no-instruction', [
    /should i (sell|exit|hold|book|redeem|withdraw|get out|stop|cut|keep)/, /do i (get out|sell|exit|hold)/,
    /sell everything/, /get out now/, /cut (my )?loss/, /book (my )?profit/, /panic sell/, /time to sell/,
  ]],
  ['no-recommendation', [
    /\b(which|what) (stock|share|fund|one|etf|sip)s? (should|to|do i|would|is best|is better)/,
    /good (stock|share|fund|buy|investment) to/, /\bis .{1,40} a good (buy|investment|stock|fund|pick)/,
    /should i (buy|invest in|pick|choose|go for|start)/, /\bbest (stock|fund|sip|share|mutual fund|index fund)/,
    /\brecommend/, /\bsuggest (a|some|me|one|any)/, /\bor\b.{0,60}\b(which|better|pick|choose|should|tell me)\b/,
    /which (one )?is better/, /if you were me/, /what would you (do|buy|pick|put|choose)/,
    /tell me what to/, /just tell me/, /where should i (put|invest)/, /what should i (buy|put|invest)/,
  ]],
];

type Topic = [RegExp, (s: GameState, snap: Snapshot) => string];

const TOPICS: Topic[] = [
  [/why (did|is|has) my (portfolio|money|value)|portfolio (fall|fell|drop|down)|why (am i|did i) (down|lose)/, (_s, snap) => {
    if (!snap.positions.length) return "There's nothing in your practice portfolio yet, so nothing has moved. Invest in one or two things and ask again, and I'll tell you which one moved your number and by how much.";
    // The biggest mover in rupees, which is not always the biggest holding.
    const top = [...snap.positions].sort((a, b) => Math.abs(b.pnl) - Math.abs(a.pnl))[0];
    const name = byId(top.lot.instrumentId).name;
    const share = snap.pnl !== 0 ? Math.round((top.pnl / (snap.value - snap.invested || 1)) * 100) : 0;
    return `Mostly ${name}. It's ${top.pnl >= 0 ? 'up' : 'down'} ${Math.abs(top.pnlPct).toFixed(1)}%, which is ${inr(Math.abs(top.pnl))}${share > 0 && share <= 100 ? `, about ${share}% of your total move` : ''}. It's ${Math.round(top.weight)}% of what you hold.\n\nWhen most of a move comes from one holding, the lever is how much you put in it, not when you bought it.`;
  }],
  [/divers/, (_s, snap) =>
    `Diversification means your result doesn't hang on being right about one thing.\n\nIf all your money is in one company and it has a bad year, so do you. Spread across fifty companies in an index fund, one bad year barely shows.\n\nThe cost is that your best case is capped too. You give up the chance of a spectacular result in exchange for not needing one.${snap.largest ? ` Right now your largest holding is ${Math.round(snap.largest.weight)}% of your practice portfolio.` : ''}`],
  [/\bsip\b|every month|monthly invest/, () =>
    "An SIP invests a fixed amount on the same date every month, automatically.\n\nThe real benefit isn't returns. It's that you stop deciding whether today is a good day to invest. When prices are low it buys more units, and when they're high it buys fewer, without you doing anything.\n\nIt also matches how a salary arrives. ₹500 a month you never think about tends to beat ₹6,000 a year you keep putting off."],
  [/index fund|what is an index|what's an index|\bnifty\b/, () =>
    "An index is a fixed list of companies. The Nifty 50 is India's fifty biggest listed companies. An index fund just buys that whole list.\n\nSo you get roughly the average result of those fifty, minus a small fee. Nobody is picking winners for you, and you aren't paying much for it.\n\nThe catch: you'll never beat the market with one, because you are the market."],
  [/mutual fund.*(stock|share)|(stock|share).*mutual fund|difference between/, () =>
    "A stock is a piece of one company. A mutual fund is a basket of many, run by a manager you pay a fee.\n\nWith a stock, you're betting on that one business. If you're right it can do very well, and if you're wrong there's nothing to cushion it. In a fund, one company going wrong gets diluted by all the others.\n\nStocks need you to have a view. Funds let you get by without one."],
  [/horizon|how long|long term|long-term/, () =>
    "Your horizon is how long before you need the money back, and it changes how much risk makes sense.\n\nOver a few months the Indian market can do almost anything. It fell nearly 38% in about five weeks in 2020. Over ten years the swings tend to even out and company earnings matter more.\n\nSo money you need next year doesn't belong in equity, however good the investment looks. Money you won't touch for ten years can sit through falls that would be unbearable on a one-year view."],
  [/how much .{0,20}(salary|invest|put)|first salary|paycheck|pay cheque/, () =>
    "I can't give you a number, but most people find this order works:\n\n1. Keep three to six months of expenses in a savings account. That's what stops you selling investments at a bad moment.\n2. Pay off anything with high interest. A credit card at 36% beats any return you'll earn.\n3. Invest what's left that you won't need for three years.\n\nThe salary card on Home lets you try a split and see how long the safety buffer takes."],
  [/volatil|why do(es)? (the )?prices?|why (do|does) .{0,20} move/, () =>
    "Prices move because people change their minds about what something is worth: on earnings, interest rates, news, and quite often on mood.\n\nVolatility is how much that happens. A volatile holding isn't necessarily a worse one, just a louder one. The trap is treating every move as news. Most daily moves are noise, and the main cost of watching them is that eventually they push you into doing something."],
  [/\bdna\b|my score|how am i doing/, (s, snap) => {
    const list = traits(s, snap);
    const score = overall(list);
    const measured = list.filter((t) => t.score > 0);
    if (!measured.length) return "You don't have a score yet. It starts once you've made a practice investment and some time has passed.";
    const weakest = [...measured].sort((a, b) => a.score - b.score)[0];
    return `Your Investor DNA is ${score} out of 100. It rates how you decide, and profit isn't part of it.\n\nYour lowest trait is ${weakest.label} at ${weakest.score}. ${weakest.evidence}\n\n${weakest.nudge}`;
  }],
  [/\bgold\b/, () =>
    "Gold is what people buy when they stop trusting everything else, so it often rises when shares fall. That makes it a useful counterweight.\n\nThe catch is that gold doesn't earn anything: no profits, no dividends, no interest. Its price only moves on what the next buyer will pay. Over long periods it has roughly kept up with inflation."],
  [/what is practice mode|what is this|how does this work|what can you do/, () =>
    "Practice Mode gives you ₹1,00,000 of practice money in a modelled market.\n\nEvery time you invest, it asks why and for how long, and keeps your answer. Then you fast-forward a year, including a fall you have to sit through. At the end you get a score for how you decided, and a replay of what you said next to what you did.\n\nNo real money is involved and nothing here can place a real order."],
];

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

const REFUSALS: Record<Exclude<Guard, 'off-topic'>, (s: GameState, snap: Snapshot) => string> = {
  injection: () =>
    "I can't switch to a different set of rules. I'm a learning coach inside a practice account, and I can't predict prices, promise returns or pick investments, whoever asks. Ask me how something works and I'll explain it.",
  'no-guarantee': () =>
    "No. Nothing in investing is guaranteed, and nobody honest will tell you otherwise. That includes index funds, which can fall 30% in a bad year. A longer horizon improves your odds, but it doesn't make anything certain. The results in Practice Mode are modelled too, not promised.",
  chasing: () =>
    "For every friend who made 3x on one stock, there are people who lost half and didn't post about it. That's survivorship: you only hear from the winners.\n\nAnything that can triple in a year can also halve. If you want to feel what that's like, put all your practice money into Tata Motors and run the 2020 year. It costs nothing to find out here.",
  'no-prediction': () =>
    "I can't tell you where a price is going. Nobody can do it reliably, which is the whole reason diversification and time horizon matter.\n\nWhat I can tell you is what moves it. A single stock moves on that company's results and how people feel about it. An index fund moves with the whole market. If a decision only works out when the price goes up soon, it's a bet, not a plan.",
  'no-instruction': (_s, snap) => {
    const line = snap.positions.length
      ? ` Your holdings are ${snap.value >= snap.invested ? 'up' : 'down'} ${Math.abs((snap.value / Math.max(snap.invested, 1) - 1) * 100).toFixed(1)}% on what you put in.`
      : '';
    return `I won't tell you to sell or to hold. Here's what's worth knowing first.${line}\n\nA fall isn't a loss until you sell. So the useful questions are: has the reason you bought actually changed, or only the price? And do you need this money in the next year? If the reason still holds and you don't need the money, the fall tells you about the price, not about your decision.`;
  },
  'no-recommendation': () =>
    "I can't pick for you. That would be advice, and I'm not an adviser. These four questions usually narrow it down:\n\n• When do you need the money back? Under three years, equity is usually the wrong tool.\n• How much of your total savings is this? The bigger the share, the more spreading it out matters.\n• Can you say what it does in one sentence? If not, that's your answer for now.\n• What would make you sell? Decide before you buy, not during a fall.\n\nYou can try any option here with practice money and see what it does to your portfolio.",
};

export function respond(input: string, s: GameState, snap: Snapshot): CoachReply {
  const q = input.toLowerCase().replace(/[’']/g, "'").trim();

  for (const [guard, patterns] of INTENTS) {
    if (patterns.some((p) => p.test(q))) {
      return { guard, text: REFUSALS[guard as Exclude<Guard, 'off-topic'>](s, snap) };
    }
  }
  for (const [pattern, answer] of TOPICS) {
    if (pattern.test(q)) return { text: answer(s, snap) };
  }
  return {
    guard: 'off-topic',
    text: "That's outside what I can help with. I only cover how investing works and what your practice portfolio is doing.\n\nTry asking what an index fund is, why your portfolio moved, what diversification gets you, or what your Investor DNA score means.",
  };
}

export const SUGGESTIONS = [
  'Why did my portfolio fall?',
  'What is diversification?',
  'Which stock should I buy?',
  'Is an index fund 100% safe?',
  'The market fell 10%. Should I sell?',
];
