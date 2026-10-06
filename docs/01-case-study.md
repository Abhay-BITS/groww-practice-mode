# Groww Practice Mode

Designing Groww for the Gen Z investor

## My take on the problem

Most people my age who want to invest already know roughly what an index fund is. Plenty of them have a Groww account. What they haven't done is put money in. So I don't think the gap is information. Groww, YouTube and half of Instagram have that covered.

What you can't get from reading is how you'll act when money you earned is down 20%. A first-time investor has never had money that could fall, so they don't know if they'll hold or panic, and not knowing is a good enough reason to wait another month. Then another.

That's why I think a normal paper-trading simulator is the wrong answer, even though it's the obvious one. Simulators keep score by returns, and over a few months returns are mostly luck. In my prototype's easy year, going all-in on Tata Motors because it was rising made 40.8%. A sensible spread of funds made 20.3%. A returns leaderboard would reward the first person and teach everyone else to copy them.

**Assumptions:**

- The user is 21 to 25, on their first salary, has finished KYC on Groww and has never placed an order. Groww can count this group, and I'd check its size first.
- The first salary is when intent is highest, and right now nothing happens at that moment.
- The blocker is confidence, not access. ₹100 minimums already exist and haven't fixed it.

## What is in scope

Practice Mode inside the Groww app for that user: ₹1,00,000 of practice money and a modelled year of market that plays out in under a minute. Every purchase asks why and for how long. Partway through, the market falls and the app waits for a decision. At the end: a score for how they decided, and a replay of what they said against what happened. A short salary plan sizes a real SIP for later.

## What is out of scope

- Real money, KYC and mandates. Groww already has these.
- Recommendations, predictions and guaranteed returns. That's the advice line, and the coach is tested against it.
- F&O, intraday, crypto and charting. Wrong for a first investment.
- Live prices. Modelled years let me put a crash in on purpose.
- Leaderboards ranked by returns, for the reason above.

## My solution, and why

**It asks why before every purchase.** Six honest options, from "I read what this does" to "it's going up and I don't want to miss it", plus a holding period. Nothing is marked right or wrong then. If it were, people would just pick the good-sounding answer.

**The score leaves out profit.** Investor DNA rates how spread out the money is, whether they kept to their own horizon, what they did in the fall, and how good their reasons were. In the easy year above, the lucky bet scores 26 and the careful portfolio scores 70.

**The market falls on purpose.** In the 2020-shaped year the index drops 36%. When it first passes 12%, the app asks: sell everything, do nothing, or buy a little more. The three buttons look identical, because highlighting one would be a recommendation. It also records how long they took. If they said losing money scares them, the alert says that back to them.

**It has an ending.** After four checks (two investments, holding through one fall, a score of 60, more than one kind of investment) it offers a real SIP built from the funds they practised with. Stocks are left out. Each fund gets at least ₹100, because ₹100 split three ways is ₹33 a fund and no fund accepts that.

**How I'd judge it:** the share of new Gen Z signups making a real investment within 30 days, checked against how many are still invested at 90. Lifting the first without the second would just mean more people quitting in their first fall.

**What I'm least sure about:** practice might replace investing instead of leading to it. And the score's weights are my judgement. With real data I'd fit them to what predicts people staying invested.
