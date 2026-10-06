import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Option } from '@/components/ui';
import { useStore } from '@/state/store';
import type { Profile } from '@/lib/types';

/**
 * Four questions, and every one of them is used later. Stage sets the paycheck
 * amount on Home, goal and fear change the Coach's framing, so nothing here is
 * decoration. We ask nothing we do not spend.
 */
const STEPS = [
  {
    key: 'stage' as const,
    q: 'Where are you right now?',
    why: 'This sets the monthly amount we use in your practice runs.',
    options: [
      { v: 'student', b: 'Studying, with some side income', n: 'Internships, freelance, part-time work' },
      { v: 'firstjob', b: 'First job, first salary', n: 'Money arriving monthly for the first time' },
      { v: 'settled', b: 'Working a couple of years now', n: 'Income is steady, savings are building up' },
    ],
  },
  {
    key: 'goal' as const,
    q: 'What would make this worth your time?',
    why: 'We will measure you against this, not against returns.',
    options: [
      { v: 'habit', b: 'Build the habit of investing monthly', n: 'Start small, stay consistent' },
      { v: 'bigbuy', b: 'Save towards something specific', n: 'A bike, a trip, a deposit' },
      { v: 'wealth', b: 'Grow money over the long run', n: 'Ten years out, not ten weeks' },
      { v: 'curious', b: 'Honestly, just understand how this works', n: 'Perfectly good reason' },
    ],
  },
  {
    key: 'fear' as const,
    q: 'What has stopped you so far?',
    why: 'We will put this in front of you on purpose, with fake money.',
    options: [
      { v: 'losing', b: 'I am scared of losing money', n: 'The most common answer, by far' },
      { v: 'jargon', b: 'The words make no sense to me', n: 'NAV, expense ratio, large cap, SIP' },
      { v: 'timing', b: 'I never know when to start', n: 'Waiting for the right moment' },
      { v: 'nothing', b: 'Nothing, I just never got around to it', n: 'Fair enough' },
    ],
  },
];

export function Onboarding() {
  const { start } = useStore();
  const [step, setStep] = useState(-1);
  const [draft, setDraft] = useState<Partial<Profile>>({});

  if (step === -1) {
    return (
      <div className="intro">
        <div className="intro-scroll">
          <div className="brandmark">
            <img src="/groww-logo.png" alt="Groww" width={44} height={44} />
            <span>Practice Mode</span>
          </div>

          <h1 className="h-screen" style={{ fontSize: 27, marginBottom: 12 }}>
            Make your first ten investing mistakes with money that isn&rsquo;t real.
          </h1>
          <p className="sub" style={{ fontSize: 14.5, marginBottom: 20 }}>
            You get &#8377;1,00,000 in fake rupees and a market that behaves like the real one.
            Over fourteen short sessions you will buy, panic, hold, and find out what kind of
            investor you actually are, before any of it costs you.
          </p>

          <div className="stack sm">
            {[
              ['We score how you decide, not how much you made.', 'A lucky bet on one stock scores badly here.'],
              ['Every decision asks you why, and remembers the answer.', 'Later, we show you what you said against what you did.'],
              ['The market will fall while you are holding.', 'That is the point. It is the only part you cannot read about.'],
            ].map(([t, d]) => (
              <div className="card flat" key={t} style={{ padding: 13 }}>
                <b style={{ fontSize: 13.5, color: 'var(--ink)', fontWeight: 650, display: 'block', marginBottom: 3 }}>{t}</b>
                <span className="tiny">{d}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pinned, so the way in is visible whatever the screen height or zoom level. */}
        <div className="intro-cta">
          <button className="btn" onClick={() => setStep(0)}>
            Set up in 30 seconds <ArrowRight size={17} />
          </button>
          <p className="tiny" style={{ textAlign: 'center', marginTop: 8 }}>
            Simulated account. No real money is involved.
          </p>
        </div>
      </div>
    );
  }

  const current = STEPS[step];
  const chosen = draft[current.key];

  const pick = (v: string) => {
    const next = { ...draft, [current.key]: v };
    setDraft(next);
    setTimeout(() => {
      if (step < STEPS.length - 1) setStep(step + 1);
      else {
        const income = next.stage === 'student' ? 8000 : next.stage === 'firstjob' ? 32000 : 65000;
        start({ name: 'you', stage: next.stage as Profile['stage'], monthlyIncome: income, goal: next.goal as Profile['goal'], fear: next.fear as Profile['fear'] });
      }
    }, 220);
  };

  return (
    <div className="pad" style={{ paddingTop: 20 }}>
      <div className="row" style={{ gap: 5, marginBottom: 22 }}>
        {STEPS.map((_, i) => (
          <div key={i} style={{ height: 3, borderRadius: 99, flex: 1, background: i <= step ? 'var(--green)' : 'var(--line)', transition: 'background .3s' }} />
        ))}
      </div>
      <h2 className="h-screen" style={{ marginBottom: 6 }}>{current.q}</h2>
      <p className="tiny" style={{ marginBottom: 20 }}>{current.why}</p>
      <div className="stack sm">
        {current.options.map((o) => (
          <Option key={o.v} on={chosen === o.v} onClick={() => pick(o.v)} title={o.b} note={o.n} />
        ))}
      </div>
      {step > 0 && (
        <button className="btn ghost" style={{ marginTop: 18 }} onClick={() => setStep(step - 1)}>Back</button>
      )}
    </div>
  );
}
