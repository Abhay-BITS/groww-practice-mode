import { byId } from '@/data/instruments';
import { overall, traits, type Snapshot } from '@/lib/dna';
import type { GameState } from '@/lib/types';

export type CoachReply = {
  text: string;
  /** Which guardrail, if any, fired. Surfaced in the UI and used by the eval set. */
  guard?: 'no-recommendation' | 'no-guarantee' | 'no-prediction' | 'no-instruction' | 'injection' | 'off-topic';
};

const has = (q: string, ...terms: string[]) => terms.some((t) => q.includes(t));

const DISCLAIM = 'Educational experience, not financial advice.';

/**
 * A deliberately boring rule engine. In a production build this is a system
 * prompt around an LLM; the guardrail set below is the part that would survive
 * that swap, which is why it is written as explicit, ordered checks rather than
 * as prose inside a prompt.
 *
 * Order matters: refusals are evaluated before helpfulness, so a question that
 * is both ("which fund should I buy, and what is an index fund?") refuses the
 * recommendation and answers the concept.
 */
export function respond(input: string, s: GameState, snap: Snapshot): CoachReply {
  const q = input.toLowerCase().trim();

  // ---- Guardrail 1: prompt injection and role override -------------------
  if (has(q, 'ignore all previous', 'ignore previous', 'ignore your instructions', 'you are now', 'pretend you are', 'act as a sebi', 'disregard your')) {
    return {
      guard: 'injection',
      text: `I can’t take on a different set of instructions. What I am is fixed: a learning companion inside a practice account, with no ability to predict prices, guarantee outcomes, or tell you what to buy. That doesn’t change on request. Ask me how something works and I’ll do my best. ${DISCLAIM}`,
    };
  }

  // ---- Guardrail 2: guaranteed returns -----------------------------------
  if (has(q, 'guarantee', 'guaranteed', 'risk free', 'risk-free', 'sure shot', 'sure-shot', 'assured return')) {
    return {
      guard: 'no-guarantee',
      text: `No. Nobody can guarantee an investment return, and anyone who does is either wrong or selling you something. Equity returns are not promised at any horizon. What a long horizon changes is the odds, not the certainty. Even the simulated results in Practice Mode are modelled, not promised. ${DISCLAIM}`,
    };
  }

  // ---- Guardrail 3: price prediction --------------------------------------
  if (has(q, 'will it go up', 'will this go up', 'will this stock', 'next month', 'target price', 'prediction', 'predict', 'forecast', 'multibagger', 'will the market')) {
    return {
      guard: 'no-prediction',
      text: `I can’t tell you where a price is going. Nobody can, consistently. That is the whole reason diversification and time horizon exist as ideas. What I can tell you is what moves this kind of investment: for a single stock it is company results and sentiment; for an index fund it is the whole market. If your decision only works when a price goes up soon, it isn’t a decision, it’s a bet. ${DISCLAIM}`,
    };
  }

  // ---- Guardrail 4: personalised buy/sell recommendation ------------------
  if (has(q, 'which stock should', 'what should i buy', 'which fund should', 'should i buy', 'what stock should', 'tell me what to buy', 'best stock', 'best fund', 'where should i invest', 'which one should i')) {
    return {
      guard: 'no-recommendation',
      text: `I can’t pick one for you. That’s advice, and I’m not an adviser. What I can do is give you the questions that narrow it down:\n\n• When do you need this money back? Under three years, equity is the wrong tool.\n• How much of your total money is this? If it’s most of it, concentration matters more than upside.\n• Can you explain what the thing does in one sentence? If not, that’s your answer for now.\n• What would make you sell? Decide that before you buy, not during a fall.\n\nIn Practice Mode you can test any of these with fake rupees and see what it does to your portfolio. ${DISCLAIM}`,
    };
  }

  // ---- Guardrail 5: instruction during a fall ------------------------------
  if (has(q, 'should i sell', 'sell everything', 'should i exit', 'should i panic', 'get out now', 'cut my losses')) {
    const held = snap.positions.length;
    return {
      guard: 'no-instruction',
      text: `I’m not going to tell you to sell or to hold. But here is what is actually true about the moment you’re in.\n\nA fall is not a loss. It becomes one when you sell. ${held ? `Your ${held} holding${held > 1 ? 's are' : ' is'} currently showing ${snap.value >= snap.invested ? 'a gain' : 'a fall'} of ${Math.abs(((snap.value / Math.max(snap.invested, 1)) - 1) * 100).toFixed(1)}% against what you put in.` : ''}\n\nThe questions worth asking: has the reason you bought actually changed, or has only the price changed? Do you need this money in the next year? If the reason is intact and you don’t need the money, a fall is information about the price, not about your decision. ${DISCLAIM}`,
    };
  }

  // ---- Helpful answers -----------------------------------------------------
  if (has(q, 'why did my portfolio', 'why is my portfolio', 'portfolio fall', 'portfolio drop', 'portfolio down', 'why did i lose')) {
    if (!snap.positions.length) {
      return { text: `Your practice portfolio has nothing in it yet, so there is nothing to explain. Put some fake rupees into one or two things and come back, then I can tell you exactly which holding moved your number and by how much.` };
    }
    const top = snap.largest!;
    const name = byId(top.lot.instrumentId).name;
    const contribution = (top.weight / 100) * top.pnlPct;
    return {
      text: `Mostly ${name}. It is ${Math.round(top.weight)}% of your portfolio and has moved ${top.pnlPct >= 0 ? 'up' : 'down'} ${Math.abs(top.pnlPct).toFixed(1)}%, which alone accounts for about ${Math.abs(contribution).toFixed(1)} percentage points of your total move.\n\nThat is what concentration does: the biggest holding writes most of the story. If you want your result to depend less on any single name, the lever is weight, not timing. ${DISCLAIM}`,
    };
  }

  if (has(q, 'divers')) {
    return { text: `Diversification means your outcome doesn’t depend on being right about one thing.\n\nIf all your money is in one company and it has a bad year, you have a bad year. If it is spread across fifty companies through an index fund, one of them having a bad year barely registers.\n\nThe trade-off is real: diversification also caps how good your best case can be. You give up the chance of a spectacular result in exchange for not needing one. For someone with their first salary and no cushion, that is usually the right trade.${snap.largest ? `\n\nRight now your largest holding is ${Math.round(snap.largest.weight)}% of your practice portfolio.` : ''} ${DISCLAIM}` };
  }

  if (has(q, 'index fund', 'what is an index', 'nifty')) {
    return { text: `An index is just a fixed list of companies. The Nifty 50 is India’s fifty largest listed companies. An index fund buys that whole list and nothing else.\n\nSo you get the average result of those fifty companies, minus a very small fee. No fund manager picking winners, no one to blame, no one to pay much.\n\nThe honest catch: you will never beat the market with it, because you are the market. For most people starting out, matching the market cheaply beats trying to beat it expensively. ${DISCLAIM}` };
  }

  if (has(q, 'mutual fund') && has(q, 'stock', 'difference', 'vs')) {
    return { text: `A stock is one company. A mutual fund is a basket of many, run by a manager you pay a fee to.\n\nWith a stock you are making a judgement about that one business. If you are right you do very well, if you are wrong there is nothing to cushion it. With a fund, one company getting it wrong is diluted by the other forty-nine.\n\nStocks ask you to have a view. Funds let you not have one. Neither is better; they are different amounts of homework. ${DISCLAIM}` };
  }

  if (has(q, 'sip', 'every month', 'monthly invest')) {
    return { text: `An SIP is a fixed amount invested on the same date every month, automatically.\n\nThe point is not returns. The point is that it removes the decision. You are not deciding whether today is a good day to invest. You decided once, and the rest happens without you. In a falling market it quietly buys more units at lower prices; in a rising one, fewer.\n\nFor someone with a monthly salary, it matches how your money actually arrives. ₹500 a month that you never think about beats ₹6,000 a year that you keep postponing. ${DISCLAIM}` };
  }

  if (has(q, 'time horizon', 'how long', 'long term', 'horizon')) {
    return { text: `Your horizon decides which risks you can afford to take.\n\nOver a few months, the Indian market can do almost anything. It fell 38% in five weeks in 2020. Over ten years, the range of outcomes narrows a lot, because short-term swings average out and company earnings start to dominate.\n\nSo money you need next year does not belong in equity, however good the investment is. Money you will not touch for a decade can sit through falls that would be unbearable on a one-year view. Same investment, different risk, purely because of time. ${DISCLAIM}` };
  }

  if (has(q, 'how much should i invest', 'how much to invest', 'first salary', 'paycheck', 'how much of my salary')) {
    return { text: `I can’t set an amount for you, but here is the order most people find works:\n\n1. Keep three to six months of expenses in a savings account first. That is not investing, it is the thing that stops you having to sell investments at a bad moment.\n2. Clear any high-interest debt. A credit card charging 36% beats any return you will earn.\n3. Whatever is left over and you will not need for three years can go into investments.\n\nThe amount matters much less than the fact that it is automatic and small enough that you don’t notice it leaving. ${DISCLAIM}` };
  }

  if (has(q, 'volatil', 'why does the price', 'why do prices')) {
    return { text: `Prices move because people change their mind about what something is worth: on earnings, on interest rates, on news, and quite often on mood.\n\nVolatility is just how much that moving around happens. A high-volatility holding is not a worse investment, it is a louder one. The mistake beginners make is treating every move as information. Most daily moves are noise, and the main cost of watching them is that noise eventually provokes a decision. ${DISCLAIM}` };
  }

  if (has(q, 'my dna', 'my score', 'investor dna', 'how am i doing')) {
    const list = traits(s, snap);
    const score = overall(list);
    const weakest = [...list].sort((a, b) => a.score - b.score)[0];
    return { text: `Your Investor DNA is ${score} out of 100. It measures how you decide, not what you earned.\n\nYour weakest trait is ${weakest.label} at ${weakest.score}. ${weakest.evidence}\n\n${weakest.nudge} ${DISCLAIM}` };
  }

  if (has(q, 'gold')) {
    return { text: `Gold is the thing people buy when they stop trusting everything else, which is why it often rises when equity falls.\n\nThat makes it useful as a counterweight in a portfolio. The catch is that gold produces nothing: no earnings, no dividend, no interest. Its price only moves on what the next person will pay. Over very long periods it has roughly kept pace with inflation, not much more. ${DISCLAIM}` };
  }

  if (has(q, 'what is practice mode', 'what is this', 'how does this work')) {
    return { text: `Practice Mode gives you ₹1,00,000 in fake rupees and a simulated market that behaves like a real one.\n\nWhat makes it different from a paper-trading toy: every time you invest, we ask why and for how long, and we keep the answer. Then we fast-forward a year, including a market fall you will have to sit through. At the end you get an Investor DNA score based on how you decided, and a replay showing what you said against what you did.\n\nNone of it involves real money, and none of it can place a real order. ${DISCLAIM}` };
  }

  return {
    guard: 'off-topic',
    text: `I’m a learning companion for a practice investing account, so I’m limited to how investing works and what your practice portfolio is doing. I can’t help with much beyond that.\n\nThings I can actually explain: what an index fund is, why your portfolio moved, what diversification buys you, why your horizon changes the risk, or what your Investor DNA score means. ${DISCLAIM}`,
  };
}

export const SUGGESTIONS = [
  'Why did my portfolio fall?',
  'What is diversification?',
  'Which stock should I buy?',
  'Can you guarantee 20% returns?',
  'The market fell 10%. Should I sell everything?',
  'Explain an index fund like I have never invested',
  'Why does time horizon matter?',
  'How much of my salary should I invest?',
];
