# Strategy canvas — the argument behind the build

Supporting material for the 1-pager. This is the reasoning; the 1-pager is the summary.

---

## 1. Why now

Four forces that only recently pointed the same way:

| Force | What changed | Implication |
| --- | --- | --- |
| **Awareness is solved** | Gen Z is the most financially literate Indian cohort on record, and the least invested | More content is not the lever. The blocker is downstream of knowledge. |
| **The finfluencer on-ramp closed** | SEBI's 2024–25 restrictions on unregistered advice removed the channel that converted awareness into action | The push that used to get people over the line is gone. Something has to replace it *inside* the product. |
| **Groww's specific asymmetry** | Highest Gen Z signup share of any platform, among the lowest revenue per user | Groww is winning acquisition and losing activation. The gap *is* the opportunity. |
| **Dormancy is structural** | A large share of demat accounts transact rarely or never | Signup is not the funnel's end. It is where the funnel currently stops. |

> Directional claims, drawn from the public commentary around SEBI's 2024–25 advisory
> restrictions, NSE demat growth disclosures and reported platform ARPU comparisons. They should be
> replaced with internal figures before anyone acts on them — they are included to show which
> numbers the argument depends on, not to assert precision I do not have.

---

## 2. Which Gen Z user

Two axes that actually separate behaviour, rather than demographics that do not.

```
                     financial awareness
                     low            high
                 ┌──────────────┬──────────────┐
    settled      │  not our     │  already     │
    (₹65k+)      │  problem     │  investing   │
                 ├──────────────┼──────────────┤
    first job    │  too early   │ ◆ BULLSEYE   │
    (₹30k)       │              │   stalled    │
                 ├──────────────┼──────────────┤
    student      │  no surplus  │  no surplus  │
    (₹8k gig)    │              │              │
                 └──────────────┴──────────────┘
```

**Bullseye: first job, high awareness, zero action.** 21–25, ₹25–40k/month, three to eighteen
months into their first salary. They follow finance content, they can define an index fund, they
have a Groww account, and they have never placed an order.

Chosen because this is the only cell where all three conditions hold at once: **surplus exists**,
**intent exists**, and **the blocker is psychological rather than structural.** Students lack
surplus; settled earners have already converted. Only this cell is losable.

**Deliberately not targeted:** active traders (already converted, and want a different product),
students with no surplus (no amount of product fixes no money), and the financially unaware (an
education problem, and a slower one).

---

## 3. Four lenses

### User lens
"I know what an index fund is. I have had the app for five months. I open it, look at the Nifty,
and close it." The blocker is not information. It is that the first transaction feels irreversible
and they have no way to find out how they will behave until they have already done it with money
that matters.

### Business lens
Groww converts signups to funded accounts worse than it converts installs to signups. Every
activated Gen Z user is a twenty-year annuity at near-zero incremental CAC. Practice Mode is an
activation product; the SIP carry-over is where it pays back.

### Competitor lens
Paper trading is a commodity — most brokers and several global apps have it. **The differentiator
cannot be the simulation.** It has to be the record the simulation keeps about you, and the fact
that practice ends. Nobody currently captures decision rationale at the point of trade, and nobody
scores a practice account on anything other than returns.

### Compliance lens
This feature lives one inch from SEBI's advice boundary, and that shaped the build more than any
other constraint:

| Risk | Mitigation in the product |
| --- | --- |
| Simulated results read as projections | Persistent badge on every simulated figure; "modelled market", never "historical" |
| Behavioural scoring reads as advice | Traits describe consequences, never instructions; no trait suggests a trade |
| The panic screen reads as a recommendation | All three options have identical visual weight — deliberately, and it was a bug once |
| The coach drifts into advice | Six ordered guardrails, refusals evaluated before helpfulness, the triggered guardrail shown in the UI |
| Carry-over pushes a beginner into a single stock | Individual stocks excluded from the SIP carry-over, whatever the practice portfolio holds |

---

## 4. Why not the obvious alternatives

| Alternative | Why not |
| --- | --- |
| Better educational content | Attacks a solved problem. The cohort is informed and still not invested. |
| Plain paper trading with virtual money | Scored on returns, it teaches concentration. Over short windows variance beats skill, so the most reckless user wins and learns the wrong lesson. |
| Gamified streaks and leaderboards | Optimises engagement, and the metric people compete on becomes returns. That makes the core problem worse. |
| A "safe starter portfolio" recommendation | Crosses the advice line, and teaches nothing — the user ends up invested without understanding why. |
| Lowering the minimum to ₹10 | Removes a *financial* barrier when the barrier is psychological. ₹10 of real money still requires the decision. |

---

## 5. Metrics

**North star:** % of new Gen Z signups who place a real investment within 30 days.

| Layer | Metric | Why this one |
| --- | --- | --- |
| Acquisition | Practice Mode start rate among non-investing signups | Is the entry point discoverable? |
| Engagement | % completing ≥2 practice investments | One is curiosity; two is a decision. |
| **The mechanism** | **% reaching the Panic Moment, and the sell rate at it** | This is the product's thesis under test. If sell rates do not fall between first and second exposure, the product is not teaching. |
| Conversion | Practice → real investment within 30 days | The north star |
| **Quality** | **% still invested at 90 days, Practice vs. control** | The one that matters most. Activation that does not survive a drawdown is churn with a delay. |

**Counter-metrics, watched for harm:**

- Users who stay in Practice Mode past 30 days without graduating — the feature has become a toy
- Average concentration of graduated real portfolios — if it rises, Practice Mode is teaching the
  wrong thing and should be rolled back
- Support contacts asking whether practice money is real

**The experiment:** hold out 50% of non-investing Gen Z signups. Primary endpoint is 90-day
retained-invested rate, not 30-day conversion. Powered for a 3pp absolute lift.

---

## 6. Risks I would raise before building

Stated plainly, because the honest version is more useful than the confident one.

1. **Practice may substitute for doing.** The most engaged users might be the least likely to
   convert. Mitigated by the 14-day terminal state and the gates, but this is the thesis risk and
   the holdout is designed to detect it.
2. **The Panic Moment is scripted, so it is survivable.** A user who knows it is fake may not react
   authentically. The deliberation-time capture partly detects this; a second, unannounced drawdown
   would test it better.
3. **Reason tags may be performed rather than honest.** Mitigated by making capture explicitly
   non-judgemental, and monitored by the reason-distribution metric — heavy clustering on the
   "good" tags means users are gaming it and the replay loses its teeth.
4. **Four traits is a model, not a truth.** The weights are reasoned, not fitted. They should be
   calibrated against which practice behaviours actually predict 90-day retention, once there is
   data to fit them to.

---

## 7. What I would build next

1. **Historical replay mode** — real NIFTY paths rather than modelled ones. More defensible, and
   lets the app say "this is what actually happened in March 2020."
2. **A second, unannounced drawdown** — tests whether composure was learned or performed.
3. **Squad comparison on behaviour, not returns** — "your Composure is higher than 70% of people
   who started the same month." Social pressure pointed at the right variable.
4. **Calibrate the DNA weights** against real 90-day retention, replacing reasoning with fitting.
