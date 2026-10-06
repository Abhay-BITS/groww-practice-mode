# Artifact 1 — your 1-pager

**Write this one yourself.** The brief says "ensure this page is not created by AI", and that
constraint is worth respecting literally — not least because this is the artifact most likely to be
read closely. What follows is the argument, the structure and the numbers. The sentences should be
yours.

Target: 300–700 words. Suggested split below adds to ~600.

---

## Structure

### a. Your take on the problem (~150 words)

**The move:** do not restate the brief. Narrow it, and say what everyone else will get wrong.

The argument to make in your own words:

- Gen Z is the most *informed* and least *invested* cohort India has had. The gap is not knowledge.
- So the obvious solution — more education, more content, a simpler explainer — attacks a problem
  that is already solved.
- The real blocker is the **first decision**, and the gap between understanding a concept and being
  willing to act on it with money you earned.
- Which means the obvious *second* solution — a paper-trading simulator — is also wrong, and this
  is the point worth landing hard:

> A paper-trading simulator scored on returns teaches beginners to gamble. Over a few months
> variance dominates skill, so whoever took the most concentrated bet wins. The user learns that
> concentration works, then repeats it with real money.

**State your assumptions explicitly.** The brief invites this:

1. The user is motivated but has not acted. They are not uninterested; they are stalled.
2. Groww already has this user's attention — this is an activation problem, not an acquisition one.
3. Monthly income arriving for the first time is the moment of maximum intent.

### b. In scope (~90 words)

Practice Mode, inside the Groww app, for a signed-up user who has not yet invested:

- ₹1,00,000 in simulated rupees against a modelled market
- A **Decision Journal** — reason and horizon captured at the moment of every purchase
- A **Time Machine** compressing a year into about a minute, across three market regimes
- A **Panic Moment** — a scripted drawdown that interrupts and records the reaction, with timing
- **Investor DNA** — four behavioural traits, no returns component
- A **Decision Replay** — stated reasons held against actual behaviour
- A **Graduation Bridge** — four gates, then a real ₹100 SIP

### c. Out of scope (~70 words)

- Real-money transactions, KYC, mandates — Groww already has these
- Stock recommendations, price predictions, target prices, guaranteed returns
- F&O, intraday, crypto, leverage, charting tools — wrong products for a first-time investor
- Social leaderboards ranked by returns — this would reintroduce exactly the behaviour the product
  exists to prevent
- Live market data — simulated prices are a deliberate choice, not a limitation

Worth one line on **why** each is excluded. "Out of scope" lists that only say *what* read as
hedging; ones that say *why* read as judgement.

### d. Solution and why (~250 words)

The loop: **Decide → Commit → Live through it → See yourself → Graduate.**

Make these four points, each with its reason:

| Decision | Why |
| --- | --- |
| **Capture the reason, not just the trade.** Reason + horizon at purchase. | This is the only artifact that makes a replay possible. Without it, a simulator has nothing to teach with. |
| **Score judgement, not returns.** Four traits: spread, patience, composure, conviction. | Removes the incentive to gamble. A lucky concentrated bet scores 31; a diversified patient portfolio scores 94 — *while losing on money.* |
| **Manufacture the drawdown.** The market falls while they hold, and the app records the reaction and how long it took. | The one thing a simulator can teach that reading cannot. A decision made in under four seconds is a reflex. |
| **Give practice a terminal state.** Four gates, then a real ₹100 SIP carrying over the fund allocation. | A practice mode you can live in is a failure. Success is leaving it. Individual stocks are excluded from carry-over. |

**Close on the metric.** North star: *% of new Gen Z signups placing a real investment within 30
days.* Guardrail: *% still invested at 90 days* — because activation that does not survive a
drawdown is churn with a delay.

---

## Numbers you can quote (all verifiable in the repo)

- Concentrated lucky portfolio: **DNA 31**. Diversified patient portfolio: **DNA 94**. Gambler
  ahead on money. `npm run test:engine`
- Crash regime: **−35.9%** peak-to-trough, finishing **+8.5%**
- **33 engine assertions**, all passing
- **14 adversarial AI prompts**, all refused correctly
- Zero horizontal overflow across all seven tabs at 390×844

---

## Things to avoid

- Do not open with "Gen Z is the future of investing." Every submission will.
- Do not list features without the reasoning. The reasoning is the thing being assessed.
- Do not hide the weaknesses. Naming the risk yourself is stronger than being asked about it.
- Keep the AI coach as a supporting detail. It is the least differentiated part — every submission
  will have a chatbot. The Decision Journal is the thing nobody else will have.
