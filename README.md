# Groww Practice Mode

**A practice investing account for 20–26 year olds that scores how you decide, not what you earned.**

Submission for the Groww Product Internship assignment.
Concept prototype — not affiliated with or endorsed by Groww.

---

## The argument in one paragraph

Gen Z is the most financially literate and least invested cohort India has had, so more education
attacks a problem that is already solved. The obvious fix — a paper-trading simulator — is worse
than nothing: scored on returns over a few months, variance beats skill, so whoever takes the most
concentrated bet wins. The user learns that concentration works, then repeats it with real money.

Practice Mode removes returns from the scoreboard entirely. It captures *why* you bought and *how
long* you said you'd hold, manufactures a market crash while you're holding, records what you did
and how long you took to decide, and then shows you the gap between what you said and what you did.
It ends — in a real ₹100 SIP.

---

## Run it

```bash
npm install
npm run dev          # http://localhost:5173
npm run test:engine  # 33 assertions on the simulation and scoring engine
npm run typecheck
npm run build
```

### Reviewer shortcuts

| URL | What you get |
| --- | --- |
| `/` | Clean first-run — the real onboarding |
| `/?demo` | A run already in progress: four months in, four holdings, one panic survived, one honest mistake in the journal |
| `/?demo&tab=dna` | Investor DNA and Decision Replay |
| `/?demo&tab=graduate` | The Graduation Bridge |
| `/?demo&tab=coach` | The guardrailed coach |

The `?demo` seed is opt-in. A real first-time user always starts from an empty account.

**To see the Panic Moment:** make two practice investments, then Time → Start the year. It fires
when the index first drops 12% below its running peak and blocks the app until you answer.

---

## The six mechanics

| | What it does | Why it exists |
| --- | --- | --- |
| **Decision Journal** | Reason + horizon captured on every purchase, before confirmation | The only artifact that makes a replay possible. Capture is deliberately non-judgemental — judgement is deferred until the outcome is known. |
| **Investor DNA** | Four traits: spread, patience, composure, conviction. **No returns component.** | Removes the incentive to gamble. Verified: a lucky concentrated bet scores **31**, a diversified patient portfolio **94** — with the gambler ahead on money. |
| **Time Machine** | A year of market in about a minute, across three regimes | A 14-day programme can't show a drawdown in real time, and a drawdown you haven't sat through is the one thing reading can't teach. |
| **Panic Moment** | A scripted −12% drawdown interrupts and blocks the app. Records the choice *and the seconds taken.* | Under four seconds is a reflex, not a decision. All three options carry identical visual weight — styling one as primary would make the screen a recommendation. |
| **Decision Replay** | Your stated reasons against what you actually did | "You said five years. You sold in three days." |
| **Graduation Bridge** | Four behavioural gates, then a real ₹100 SIP carrying over your fund allocation | A practice mode you can live in is a failure. Success is leaving it. Individual stocks are excluded from carry-over. |

---

## How it's built

```
src/
  data/instruments.ts   9 instruments, each with its plain-English line and its honest catch
  lib/market.ts         Deterministic market: seeded PRNG, per-instrument beta + idiosyncratic vol,
                        scripted shock, endpoint pinned in log space
  lib/dna.ts            Portfolio snapshot, four behavioural traits, portfolio insights
  lib/coach.ts          Six ordered guardrails, refusals evaluated before helpfulness
  lib/types.ts          Reasons (with quality weights), horizons, trades, lots, panic events
  state/store.tsx       Context + localStorage; buy/sell/advance/answerPanic
  state/demo.ts         The ?demo seed
  components/ui.tsx     Design primitives: Ring, Spark, Donut, Sheet, jargon tooltip
  screens/              Seven screens
  styles/globals.css    Groww tokens, phone shell, full-bleed below 460px
test/engine.test.ts     33 assertions on product claims, not on functions
docs/                   The written artifacts
```

React 18 + TypeScript + Vite. No UI framework, no chart library, no backend — charts are hand-rolled
SVG, state is local, and the whole bundle is ~74 kB gzipped.

---

## What's verified

- **33 engine assertions pass** — each regime lands within 2% of its stated annual return; the
  crash draws down 35.9% and recovers to +8.5%; paths are byte-identical across runs; judgement
  outscores luck.
- **14 adversarial AI prompts** refuse correctly — recommendations, predictions, guarantees,
  buy/sell instructions, role override, off-topic.
- **Full journey driven end to end** under browser automation: onboarding → invest → journal →
  fast-forward → panic → replay → coach. No JS errors.
- **Mobile verified at 390×844** under device emulation: zero horizontal overflow on all seven tabs.

Two product bugs were found by the engine tests rather than by clicking: the market regimes drifting
away from the years they claimed to be, and the Spread trait saturating at 100 for any four-holding
portfolio.

---

## Documents

| | |
| --- | --- |
| [Strategy canvas](docs/00-strategy-canvas.md) | Why now, segmentation, four lenses, metrics, risks |
| [1-pager skeleton](docs/01-one-pager-skeleton.md) | Structure and argument for the written page |
| [Prompt log](docs/02-prompt-log.md) | Every prompt, what came back, what had to be corrected |
| [Evals](docs/03-evals.md) | Engine, AI safety, and comprehension evals |

---

## Disclaimers

All prices, portfolios, market movements and results are **simulated**. Market regimes are modelled
on the shape of real Indian market years, not replays of them. Nothing here is investment advice,
no real transaction is possible, and the Graduation Bridge stops at a mock confirmation — it does
not create a real SIP.
