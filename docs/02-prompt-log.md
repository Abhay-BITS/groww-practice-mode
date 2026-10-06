# Prompt log

How Groww Practice Mode was built, in the order it happened.

**Version 1** was built in Bolt from seven prompts and submitted in September. Those prompts are summarised at the end.

**Version 2** is this one. It was rebuilt with Claude Code over about a day, starting from the version 1 code and documents. Below are the prompts I actually gave, in order. I dictated most of them, so I've taken out filler words and repetition, but I haven't changed what I asked for. After each one: what came back, and what I did with it.

## Round 1: the rebuild brief

> I've already submitted this assignment, but I want the version I'd have made with another 24 hours. Go through the problem statement, my case study, my prompt log, my evals and my project code. I've also attached another candidate's submission. Tell me how you'd solve it, use my Practice Mode idea, give me ideas we can actually build, then build them. Make it look like Groww, and push it to my GitHub so I can host it on Vercel.

**What came back.** A comparison of the two submissions. The other candidate's argument was stronger than mine. They segmented their users, cited data and set success metrics, and I'd done none of those. My prototype was stronger than theirs. The sharpest point was that we'd both built a virtual-money simulator, and that on its own is something any broker can copy. The suggestion was to make the record of decisions the core instead: why people bought, what they did in a fall, and whether they stuck to their plan.

It proposed six pieces: a decision journal, a behaviour score, a fast-forward year, a scripted crash, a replay, and a route out to a real SIP. Then it asked me three questions before writing any code. After that it built the prototype and wrote first drafts of this log, the evals and a strategy note.

**What I decided.**

| Question | My answer | Why |
| --- | --- | --- |
| How much to build | All six | They only make sense together. The replay needs the journal, and the score needs the crash. |
| Desktop page or phone app | A phone app in Groww's style | Groww is a phone app. A desktop demo would have looked like a third-party tool. |
| Who writes the case study | Me, from an outline | The brief says it shouldn't be AI-written. I changed this in Round 2. |

## Round 2: the documents

> I've already submitted, so you can write the documents too.

This produced the case study draft. I'm noting it because it's true, and because Round 4 found real problems in the drafts from Rounds 1 and 2.

## Round 3: what I didn't like when I opened it

> The Groww logo is used badly and isn't placed well, and there's no logo inside the phone at all. When I opened the site it was already zoomed in, so I couldn't find the button and got confused. The phone needs to look right even when the screen is zoomed in. There's a sparkle emoji on the first screen, which isn't good. Use the Groww logo instead. There are em dashes everywhere. And there's too much small print: "no real money, no bank account, no KYC, nothing here is advice" on every screen.

| What I saw | Cause | Change |
| --- | --- | --- |
| Logo in a white box | The image file had a solid white background | Cut out on a transparent circle, then used in the header, inside the app, and as the browser icon |
| Couldn't find the button when zoomed in | Below 1100px wide, the side panel stacked above the phone and pushed it off screen. Zoom shrinks the page width, so zooming caused exactly that. | The phone can never be taller than the window, the side panel hides when there isn't room, and the button is pinned to the bottom. Checked at 100%, 150% and 200% zoom and on two phone sizes. |
| Sparkle emoji | Placeholder icon | Groww logo |
| Em dashes | The generated copy used them everywhere | Removed from the app and the documents |
| Too much small print | The same disclaimer repeated on each screen | One short line per screen |

All five were things I noticed just by using it, and none of them were in the tests.

## Round 4: critique everything again

> Check the whole prototype and process again. Critique it yourself, and make any design or text changes you think are needed. Everything should be presentable. None of it should read like it was written by AI.

This was the most useful round. Claude went through every screen and state on a phone-sized browser, rather than only reading the code. These are the problems that came out of it:

| Problem | Why it mattered | Fix |
| --- | --- | --- |
| In the 2020 crash, Tata Motors (the riskiest stock) fell 3.8%, but the balanced fund fell 16% | It teaches the opposite of what's true. Random noise was swamping the market's effect. | Each price now follows the market by its sensitivity, plus a small wobble that pulls back towards it. Each year's expected pattern (risky stocks fall furthest, gold holds up in 2020) is now a test. |
| The price on the detail sheet didn't match the list on day one | First impressions look broken | Three months of price history before day one, so both read from the same point |
| A ₹100 SIP was split into three ₹33 SIPs | Funds don't accept ₹33. A Groww PM would spot it straight away. | At least ₹100 per fund. Smaller funds drop out, and the app says why. |
| Selling everything at the crash still ticked "held through a fall" | The graduation check could be passed by doing the wrong thing | Fixed, with a test so it can't come back |
| Onboarding asked about goals and never used the answer | The screen promised "we'll measure you against this" | Dropped the question. The other answer, what has stopped you so far, now changes the crash alert and the end-of-year summary. |
| "Fourteen sessions" was promised but never built | Untrue copy | Removed |
| The salary card on Home went nowhere | A dead end in the main screen | Now a real split of your salary, and its "invest" amount becomes the suggested SIP |
| The coach handled 12 of its 14 test prompts, but only 4 of 16 reworded ones | It had been written to pass its own test questions | Rewritten. Details and the honest holdout score are in the evals. |
| Browser pop-up dialogs, two unlabelled icons in the header, emoji in the reasons | Each one made it look like a demo, not an app | In-app dialogs, a labelled "DNA" score chip, plain text |

It also found that the earlier drafts of this log and the evals overstated things. The log described the build as neat question-and-answer exchanges, and the evals marked six coach prompts as passing that had never been run. Both documents have been rewritten, so every result in them is one that was actually measured.

## What I'd do differently

I'd write the coach's test prompts before building the coach, and keep some back that the builder never sees. Both kinds of coach failure above came from testing against the same questions it was written for.

And I'd use it myself on a phone before reading any code. Everything in Round 3 was obvious the moment I opened it.

## Version 1 prompts (Bolt, September)

1. Build "Groww Practice Mode" for 20 to 26 year old first-time investors: ₹1,00,000 of virtual money, with a learning layer around the simulation. Eleven screens, from landing to a bridge to real investing.
2. Make the paper trading work: deduct cash, track holdings and allocation, stop over-investing, and allow a reset.
3. Add "Learn from your portfolio": plain observations about the user's own allocation, with no judgement of them as an investor.
4. Add an AI learning companion that explains concepts, refuses to recommend, predict or guarantee, and shows a disclaimer.
5. Add a stress test: market falls of 10% and 20%, and the largest holding moving 20% either way, labelled "Simulation, not a prediction".
6. Review the whole product as a 20 to 26 year old who has never invested, and remove jargon.
7. Check the full journey end to end and fix anything broken or confusing.
