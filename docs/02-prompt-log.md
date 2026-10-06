# Artifact 2. Prompt log

How the prototype was actually built. Each prompt is reproduced as it was sent, followed by
what came back and what had to be corrected. The corrections are the useful part: they are
where product judgement had to override what the model produced.

---

## Prompt 1. Frame the problem before writing any code

> I am designing a feature inside the Groww app for first-time investors aged 20–26 in India.
> Before we build anything, argue the opposite of the obvious solution.
>
> The obvious solution is a paper-trading simulator with virtual money. Tell me why that fails
> for this segment. Specifically: what does a beginner learn from paper trading that they could
> not have learned by reading, and what do they fail to learn? Be concrete and do not hedge.

**What came back:** three failure modes that shaped the entire product , 

1. Paper trading teaches instrument mechanics (how to place an order), which is not the blocker.
   The blocker is the decision, not the interface.
2. Without real money at stake there is no emotional load, so the one thing a simulator could
   uniquely teach, how you behave in a drawdown, is exactly what it fails to teach.
3. Virtual portfolios reward whoever took the most concentrated bet, because over a short window
   variance dominates. A simulator that scores returns actively teaches beginners to gamble.

**What I did with it:** point 3 became the central design constraint. The product does not score
returns at all. Points 1 and 2 became the Decision Journal and the Panic Moment.

---

## Prompt 2. Pressure-test the differentiator

> My wedge is this: the simulator records *why* the user made each decision: a reason tag and a
> time horizon captured at the moment of purchase, and replays it against what they actually did.
>
> Attack this idea. Where does it break? Where will users lie, skip, or game it? What is the
> smallest version that still works?

**What came back:** the useful objections , 

- Users will pick whichever reason sounds best unless the flow is explicitly non-judgemental at
  capture time. → The reason picker shows no scoring, no warnings and no "good/bad" signal.
  Judgement is deferred entirely to the replay, after the outcome is known.
- A reason tag with no consequence is a dead field. → The horizon became a commitment: selling
  before it elapses is recorded as a broken promise and costs Patience points.
- Six reason options is near the limit before the list becomes a survey. → Capped at six.

---

## Prompt 3. Build the market engine

> Write a deterministic market simulation in TypeScript for an investing-practice app.
>
> Requirements:
> - Three selectable year-long regimes: a crash-and-recover year, a sideways year, a steady bull year.
> - 250 trading days. Seeded PRNG so every user sees an identical path, because the scores must be comparable.
> - Nine instruments, each with a beta to the index and its own idiosyncratic volatility.
> - Each regime must finish within 2% of its stated annual return, or the label on it is a lie.
> - Expose the first day the index is more than 12% below its running peak. That is where a
>   scripted "panic" event will fire.
>
> No charting library. Pure functions, cached per regime.

**What came back:** a working mulberry32 + Box-Muller implementation.

**What was wrong:** the endpoint constraint was ignored. A random walk wanders: the "sideways
year" finished at **−20%** and the "steady bull year" at **+17.7%** against a stated +27%. A
regime called "the sideways year" that loses a fifth of your money teaches the wrong lesson.

**The fix I specified:**

> After generating the path including the shock, pin the endpoint. Compute realised log return,
> compare to target, and distribute the correction evenly across all days in log space. The crash
> must still crash, only where the year *ends* should change.

Result: crash year now −35.9% peak-to-trough, finishing +8.5%. That is the 2020 story, which is
the whole point of including it.

---

## Prompt 4. Score judgement instead of returns

> Design a four-trait behavioural score for a practice investor. Hard constraint: **profit must not
> appear in any formula.** A user who put everything into one stock and got lucky must score badly.
>
> Derive each trait only from recorded behaviour:
> - Spread, concentration of the portfolio
> - Patience, exits measured against the horizon stated at purchase
> - Composure: the choice made during the scripted drawdown
> - Conviction, quality of recorded reasons, weighted by rupees committed
>
> For each trait return the score, the evidence in the user's own data, and one nudge. The nudge
> describes a consequence. It never issues an instruction and never calls the user good or bad.

**What came back:** a sound structure. Herfindahl for concentration, rupee-weighted reason quality
for conviction.

**What was wrong:** the Spread formula saturated, any four-holding portfolio scored 100, so the
trait stopped discriminating almost immediately.

**The fix:** recalibrated to `(1 − HHI) × 95 + categories × 5`, so a sensible four-way split lands
in the high eighties. The score stays reachable without ever being finished.

**Verified by test:** a concentrated lucky gambler scores **31**; a diversified patient holder
scores **94**, on the same market path, with the gambler ahead on money.

---

## Prompt 5. The Panic Moment

> Add an interrupt to the fast-forward. When the index first crosses a 12% drawdown, stop the clock
> and block the app with a full-screen decision: sell everything, hold, or buy more.
>
> Record the choice *and the time taken to make it*, because a decision made in under four seconds is a
> reflex, not a decision, and should score differently.
>
> Critical: the three options must carry identical visual weight. Styling one as the primary action
> turns this screen into investment advice.

**What came back:** the modal, the timer, and the deliberation-time capture.

**What was wrong:** it shipped "Buy more while it is cheaper" as the green primary button and
"Sell everything" as a muted outline. Visual hierarchy *is* a recommendation. Caught on review of
the rendered screen, not in the code, all three are now identical ghost buttons.

---

## Prompt 6. Guardrail the coach, refusals first

> Write the response engine for a beginner investing coach. Ordered rules, refusals evaluated
> **before** helpfulness, so a question that is both ("which fund should I buy, and what is an
> index fund?") refuses the recommendation.
>
> Five hard refusals: prompt injection, guaranteed returns, price prediction, personalised
> buy/sell recommendation, buy/sell instruction during a fall.
>
> A refusal must not be a dead end. Each one replaces the thing it will not do with the questions
> a person should actually be asking. Surface which guardrail fired in the UI, show the refusal
> rather than hiding it in polite language.

**What came back:** the ordered matcher and the refusal copy.

**What I changed:** the first draft of the guarantee refusal opened with "I understand you're
looking for certainty…". Padding before a refusal reads as a soft yes. Rewritten to open on the
word **No.**

---

## Prompt 7. Make it look like Groww, not like a demo wearing Groww's colours

> Rebuild the UI as a mobile app rendered in a phone frame, using Groww's real tokens:
> #00D09C primary, #5367FF secondary, #121212 / #44475B / #7C7E8C text ramp, #E9E9EB borders,
> Inter throughout, tabular numerals on every currency figure.
>
> Five-tab bottom navigation. Bottom sheets rather than pages for anything modal.
>
> Below 460px the phone frame must disappear entirely and the app must go full-bleed, because this will
> be opened on a phone by people reviewing it.

**What came back:** the design system and the component layer.

**What was wrong:** the mobile breakpoint was written but never verified, because screenshots taken
through Chrome's `--window-size` do not actually set the layout viewport. Verified properly under
real device emulation at 390×844: marketing pane hidden, **zero horizontal overflow on all seven
tabs.**

---

## Prompt 8. Adversarial review as a hostile reviewer

> You are reviewing this as a Groww PM who has seen forty intern submissions and is looking for a
> reason to reject this one. Where does it fall apart?
>
> Then separately: you are a SEBI compliance officer. What in here would you refuse to ship?

**What came back, and what I changed:**

| Objection | Change made |
| --- | --- |
| "A fourteen-day practice account is a retention product, not an acquisition one: where is the exit?" | The Graduation Bridge became mandatory, with four behavioural gates and a real ₹100 SIP as the terminal state. Practice Mode is a programme with an end, not a sandbox. |
| "Carrying a practice portfolio into real money could push a beginner into a single stock." | Individual stocks are excluded from the SIP carry-over. Funds only, regardless of what the practice portfolio holds. |
| "Simulated results displayed in rupees look like projections." | Every currency figure in a simulated context carries a persistent badge, and the Time Machine is labelled a modelled market, not a historical replay. |
| "The reviewer will open this and see an empty account, which hides every feature that needs history." | Added an explicit opt-in `?demo` seed and `?tab=` deep links. A real first-time user still starts empty. |

---

## Prompt 9. Write the tests, not the claims

> Write assertions for the simulation and scoring engine. Do not test that functions run, test the
> product claims:
>
> - Each regime finishes within 2% of its stated annual return.
> - The crash regime draws down more than 25% and still recovers above its start.
> - The calm regime never triggers a panic.
> - Paths are byte-identical across runs.
> - A diversified patient portfolio outscores a concentrated lucky one, **while losing to it on money.**
> - Every guardrail fires on its canonical adversarial prompt.
> - No response in any path promises a return.

**Result:** 33 assertions, all passing. Two product bugs were found by these tests rather than by
clicking: the regime endpoint drift, and the Spread trait saturating.

---

## What the model was not allowed to decide

Recorded deliberately, because it is the honest answer to "how much of this is yours":

- **Not scoring returns.** The single most important decision in the product. Every draft that
  included a returns-based score was rejected.
- **Non-judgemental capture, deferred judgement.** Models consistently wanted to warn the user at
  the moment they picked a weak reason. That destroys the mechanism, because the replay only teaches
  because the user was allowed to be honest first.
- **Equal visual weight on the panic options.** Caught on visual review.
- **Excluding single stocks from the SIP carry-over.** A product-safety call, not a UX one.
- **The 14-day programme with a terminal state.** Models default to open-ended engagement loops.
  Practice Mode is designed to be left.
