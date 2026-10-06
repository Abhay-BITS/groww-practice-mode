# Prompt log

The prompts I used to build Groww Practice Mode with Claude Code, in the order I gave them. I dictated most of them, so I've trimmed each one to the parts that shaped the product. After each prompt: what came back, and what I did with it.

## 1. The brief

> Build a Groww Practice Mode for 20 to 26 year olds making their first investment. Start from the idea of practising with virtual money, but give me ideas we can actually build that go further than that, then build them. Make it look like Groww, and push it to my GitHub so I can host it on Vercel.

**What came back.** Before any code, a challenge to the idea itself. A virtual-money simulator on its own is easy for any broker to copy, and if it keeps score by returns it ends up rewarding whoever got lucky. The suggestion was to make the record of decisions the core instead: why people bought, what they did when the market fell, and whether they stuck to their own plan.

It proposed six pieces: a decision journal, a behaviour score, a fast-forward year, a scripted crash, a replay, and a way out to a real SIP. Then it asked me a few questions before writing anything. These two shaped the product.

**What I decided.**

| Question | My answer | Why |
| --- | --- | --- |
| How much to build | All six | They only make sense together. The replay needs the journal, and the score needs the crash. |
| Desktop page or phone app | A phone app in Groww's style | Groww is a phone app. A desktop page would have looked like a third-party tool. |

## 2. What I didn't like when I opened it

> The Groww logo is used badly and isn't placed well, and there's no logo inside the phone at all. When I opened the site it was already zoomed in, so I couldn't find the button and got confused. The phone needs to look right even when the screen is zoomed in. There's a sparkle emoji on the first screen, which isn't good. Use the Groww logo instead. There are em dashes everywhere. And there's too much small print: "no real money, no bank account, no KYC, nothing here is advice" on every screen.

| What I saw | Cause | Change |
| --- | --- | --- |
| Logo in a white box | The image file had a solid white background | Cut out on a transparent circle, then used in the header, inside the app, and as the browser icon |
| Couldn't find the button when zoomed in | Below 1100px wide, the side panel stacked above the phone and pushed it off screen. Zooming in shrinks the page width, so zoom caused exactly that. | The phone can never be taller than the window, the side panel hides when there isn't room, and the button is pinned to the bottom. Checked at 100%, 150% and 200% zoom and on two phone sizes. |
| Sparkle emoji | Placeholder icon | Groww logo |
| Em dashes | The generated copy used them everywhere | Removed |
| Too much small print | The same disclaimer repeated on each screen | One short line where it's needed |

I found all five just by using it. None of them were in the tests.

## 3. Critique everything

> Check the whole prototype again. Critique it yourself, and make any design or text changes you think are needed. Everything should be presentable.

This was the most useful prompt. Claude went through every screen and state in a phone-sized browser instead of only reading the code, and found these:

| Problem | Why it mattered | Fix |
| --- | --- | --- |
| In the 2020-style crash, Tata Motors (the riskiest stock) fell 3.8% while the balanced fund fell 16% | It teaches the opposite of what's true. Random noise was swamping the market's effect. | Each price now follows the market by its sensitivity, plus a small wobble that pulls back towards it. Each year's expected pattern (risky stocks fall furthest, gold holds up in 2020) is now a test. |
| The price on the detail sheet didn't match the list on day one | First impressions look broken | Three months of price history before day one, so both read from the same point |
| A ₹100 SIP was split into three ₹33 SIPs | Funds don't accept ₹33. A Groww PM would spot it straight away. | At least ₹100 per fund. Smaller funds drop out, and the app says why. |
| Selling everything at the crash still ticked "held through a fall" | The graduation check could be passed by doing the wrong thing | Fixed, with a test so it can't come back |
| Onboarding asked about goals and never used the answer | The screen promised "we'll measure you against this" | Dropped the question. The other answer, what has stopped you so far, now changes the crash alert and the end-of-year summary. |
| The copy promised "fourteen sessions", which didn't exist | Untrue copy | Removed |
| The salary card on Home went nowhere | A dead end on the main screen | Now a real split of your salary, and its "invest" amount becomes the suggested SIP |
| The year played out in 7.5 seconds, while the copy said "about ten minutes" | Too fast to feel anything, and the copy was wrong | Slowed to about 25 seconds, and the copy now says "under a minute" |
| The coach handled 12 of its 14 test prompts, but only 4 of 16 reworded ones | It had been written to pass its own test questions | Rewritten. Details and the holdout score are in the evals. |
| Browser pop-up dialogs, two unlabelled header icons, emoji in the reasons | Each one made it feel less like a real app | In-app dialogs, a labelled "DNA" score chip, plain text |

## What I'd do differently

I'd write the coach's test prompts before building the coach, and keep some aside that the builder never sees. Both kinds of coach failure came from testing it against the same questions it was written for.

And I'd use it on a phone before reading any code. Everything in step 2 was obvious the moment I opened it.
