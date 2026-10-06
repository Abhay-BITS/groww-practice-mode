# Strategy note

Supporting detail behind the case study: who exactly this is for, how I'd measure it, what could go wrong, and how I'd roll it out. Optional reading.

## Who exactly

I'd segment by where people are stuck in Groww's own funnel rather than by age or income, because Groww can see the funnel and act on it the same day.

```
 Installed  →  KYC done  →  Money added  →  First order  →  Still invested at 90 days
                    └──────────── stuck here ────────────┘
```

The group I'd build for is **KYC done, never placed an order**, aged 21 to 25.

- **Groww has already paid to acquire them.** They found the app, signed up and got through KYC. Converting one costs a fraction of finding a new user.
- **Nothing practical is in their way.** Payments, minimums and KYC are all done. What's left is the decision, which is the part Practice Mode is built for.
- **It can be measured on day one.** This is a filter on data Groww already has, not a persona.

Within that group I'd start with people on their first salary, since that's when intent peaks. Groww can't see salaries, so the app asks: onboarding's first question is whether you're studying, in your first job, or a few years in.

## Why now

- In 2024 SEBI restricted regulated firms from working with unregistered finfluencers. For a lot of young people, that content was the push that finally got them to act. Groww now has to provide that push inside the product. (I'd confirm the exact circular before quoting it.)
- Demat accounts in India have grown much faster than the number of people actively investing. A large share of accounts sit unused. That's the cohort above.

**Numbers I'd pull before building:** the size of the "KYC done, never ordered" group aged 21 to 25, the median time from KYC to first order, and how many first-time investors are still invested 90 days after their first fall of 10% or more.

## How I'd measure it

**North star:** the share of new Gen Z signups who make a real investment within 30 days.

**Guardrail:** the share still invested at 90 days. Getting people to invest once and then lose them in their first fall would be worse than doing nothing.

**Signs it's working along the way:**

- Practice Mode start rate in the target group
- The share who reach the crash alert, and how many sell at it
- Whether the sell rate falls between someone's first and second run (the clearest sign of learning)
- How often the salary plan's invest amount becomes the real SIP amount

**Signs it's going wrong:**

- People using Practice Mode for more than 30 days without investing. It's become a game.
- Graduates' real portfolios being more concentrated than the practice ones
- Support tickets asking whether the practice money is real

**The experiment.** Show Practice Mode to half the target group and hold the other half back. The main result is the 90-day invested rate, not the 30-day one.

## Risks

1. **Practice could replace investing.** The keenest practisers might be the least likely to start for real. The four graduation checks and a clear ending help, but this is the main risk, and the holdout group is there to catch it.
2. **A scripted crash is survivable.** People who know the money is fake may not react honestly. The decision timer partly shows this. A second, unannounced fall would show it better.
3. **People may perform their reasons.** If most pick the "good" reasons, the replay stops meaning anything. I'd watch the spread of answers, since heavy bunching on the responsible-sounding options is the warning sign.
4. **The score weights are my judgement.** They should be refitted to whichever practice behaviours actually predict 90-day retention, once there's data.

## Rollout

1. **Five users, by hand.** Run the comprehension sessions in the evals before anything ships.
2. **5% of the target group, with a holdout.** Rules-based coach only, since it fails safe.
3. **Language-model coach,** allowed to ship only if it passes all 42 eval prompts plus a fresh holdout set.
4. **Then expand:** real historical market replays instead of modelled years, a second unannounced fall, and comparing behaviour (not returns) with friends who started the same month.
