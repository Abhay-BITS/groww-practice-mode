# Groww Practice Mode
### Learning to invest by finding out how you behave

**Live app:** https://groww-practice-mode.vercel.app/?demo  ·  **Code:** https://github.com/Abhay-BITS/groww-practice-mode

---

## My take on the problem

India's 20–26 year olds are the most financially literate cohort the country has had, and the least
invested. That gap is the problem, and it tells you what the problem is *not*. It is not a knowledge
gap. Someone who can define an index fund and still hasn't bought one is not missing information.

What they are missing is evidence about themselves. A first-time investor has no idea how they will
behave when their money falls 20%, because they have never had money that could fall. Reading about
volatility does not help. Everyone agrees with "stay invested" in the abstract and sells anyway.

So the obvious fix (more explainers, simpler onboarding) attacks a problem that is already solved.
And the second-most obvious fix is actively harmful. **A paper-trading simulator scored on returns
teaches beginners to gamble.** Over a few months variance beats skill, so whoever took the most
concentrated bet tops the leaderboard, concludes concentration works, and repeats it with real
money. Most simulators are training grounds for the exact behaviour that ruins new investors.

**My assumptions:** the user is stalled, not uninterested. They already have a Groww account, so
this is an activation problem, not an acquisition one. And the first monthly salary is the moment of
maximum intent, and the moment currently wasted.

## What is in scope

Practice Mode, inside the Groww app, for a signed-up user who has never invested. ₹1,00,000 in
simulated rupees against a modelled market, plus six mechanics: a **Decision Journal** capturing
*why* and *for how long* before every purchase; a **Time Machine** compressing a year into a minute;
a **Panic Moment** that interrupts with a crash and records the reaction and the seconds taken;
**Investor DNA**, four behavioural traits with no returns component; a **Decision Replay**; and a
**Graduation Bridge** ending in a real ₹100 SIP.

## What is out of scope

Real-money rails, KYC and mandates. Groww has these already. Recommendations, predictions and
target prices, because they are the advice boundary and the product has to live on the right side of
it. F&O, intraday, crypto and charting, because they are the wrong products for someone who has
never placed an order. Live market data, because simulated prices are a deliberate choice: they let
me script a crash on demand, which is the whole point. And **leaderboards ranked by returns**, which
would reintroduce precisely the behaviour this product exists to prevent.

## My solution, and why

The loop is **Decide → Commit → Live through it → See yourself → Graduate.**

**I capture the reason, not just the trade.** Every purchase asks why and for how long, before
confirmation. Capture is deliberately non-judgemental, with no warnings and no scoring, because the replay
only teaches if the user was allowed to be honest first. Without this record, a simulator has
nothing to teach with.

**I score judgement, not returns.** Spread, patience, composure, conviction. Profit appears in no
formula. In testing, a lucky concentrated bet scores **31** and a diversified patient portfolio
scores **94**, while the gambler is ahead on money. That inversion is the product.

**I manufacture the drawdown.** The market falls 12% while they are holding, the app blocks, and it
records both the choice and how long it took. Under four seconds is a reflex, not a decision. All
three options carry identical visual weight, because styling one as primary would make the screen a
recommendation.

**I gave practice an ending.** Four behavioural gates, then a real ₹100 SIP carrying over the fund
allocation they built. Individual stocks are excluded. A practice mode you can live in has failed;
success is leaving it.

**North star:** % of new Gen Z signups placing a real investment within 30 days. **Guardrail:** %
still invested at 90 days, because activation that does not survive a drawdown is churn with a
delay.
