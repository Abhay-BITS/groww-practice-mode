import { useState } from 'react';
import { ArrowRight, ChevronLeft } from 'lucide-react';
import { Option } from '@/components/ui';
import { useStore } from '@/state/store';
import type { Fear, Profile } from '@/lib/types';

/**
 * Two questions, and both are spent later. Stage sets the salary used on Home.
 * Fear changes what the panic moment, the time machine and Home say to you.
 * An earlier version asked a third question about goals and then never used
 * the answer, which is worse than not asking.
 */
const STAGES: { v: Profile['stage']; b: string; n: string; income: number }[] = [
  { v: 'student', b: 'Studying, with some side income', n: 'Internships, freelancing, part-time work', income: 8000 },
  { v: 'firstjob', b: 'First job, first salary', n: 'Money landing every month for the first time', income: 32000 },
  { v: 'settled', b: 'Working for a couple of years', n: 'Steady income, some savings already', income: 65000 },
];

const FEARS: { v: Fear; b: string; n: string }[] = [
  { v: 'losing', b: "I'm scared of losing money", n: "We'll make it happen, with fake money, so you know what you do" },
  { v: 'jargon', b: "The words don't make sense", n: 'NAV, expense ratio, large cap. Every term here explains itself' },
  { v: 'timing', b: "I never know when to start", n: "We'll show you exactly how hard it is to pick the right day" },
  { v: 'nothing', b: 'Nothing really, I just never did it', n: 'Fair. Then this is the easy part' },
];

export function Onboarding() {
  const { start } = useStore();
  const [step, setStep] = useState<'intro' | 'stage' | 'fear'>('intro');
  const [stage, setStage] = useState<Profile['stage'] | null>(null);
  const [fear, setFear] = useState<Fear | null>(null);

  if (step === 'intro') {
    return (
      <div className="intro">
        <div className="intro-scroll">
          <div className="brandmark">
            <img src="/groww-logo.png" alt="Groww" width={44} height={44} />
            <span>Practice Mode</span>
          </div>

          <h1 className="h-screen" style={{ fontSize: 27, marginBottom: 12 }}>
            Make your first investing mistakes with money that isn&rsquo;t real.
          </h1>
          <p className="sub" style={{ fontSize: 14.5, marginBottom: 20 }}>
            You get &#8377;1,00,000 in practice money and a year of market that plays out in under
            a minute. You&rsquo;ll pick investments, watch them fall, decide what to do about it, and find
            out what kind of investor you are before it costs you anything.
          </p>

          <div className="stack sm">
            {[
              ['You tell us why you bought', 'Then we show you what you said next to what you did.'],
              ['The market will fall while you hold', "Reading about a crash and sitting through one aren't the same thing."],
              ["Your score isn't your profit", 'It rates how you decided. A lucky bet on one stock scores badly.'],
            ].map(([t, d]) => (
              <div className="card flat" key={t} style={{ padding: 13 }}>
                <b style={{ fontSize: 13.5, color: 'var(--ink)', fontWeight: 650, display: 'block', marginBottom: 3 }}>{t}</b>
                <span className="tiny">{d}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pinned, so the way in stays visible at any window height or zoom level. */}
        <div className="intro-cta">
          <button className="btn" onClick={() => setStep('stage')}>
            Get started <ArrowRight size={17} />
          </button>
          <p className="tiny" style={{ textAlign: 'center', marginTop: 8 }}>Two questions. No real money, no KYC.</p>
        </div>
      </div>
    );
  }

  const isStage = step === 'stage';
  return (
    <div className="pad" style={{ paddingTop: 14 }}>
      <div className="row" style={{ marginBottom: 18 }}>
        <button className="link-back" onClick={() => setStep(isStage ? 'intro' : 'stage')}>
          <ChevronLeft size={18} /> Back
        </button>
        <div className="grow" />
        <span className="tiny num">{isStage ? '1' : '2'} of 2</span>
      </div>

      <h2 className="h-screen" style={{ marginBottom: 6 }}>
        {isStage ? 'Where are you right now?' : "What's stopped you so far?"}
      </h2>
      <p className="tiny" style={{ marginBottom: 20 }}>
        {isStage
          ? 'We use this for the salary you plan on the home screen.'
          : "Whatever you pick, we'll put it in front of you on purpose."}
      </p>

      <div className="stack sm">
        {isStage
          ? STAGES.map((o) => (
              <Option
                key={o.v} on={stage === o.v} title={o.b} note={o.n}
                onClick={() => { setStage(o.v); window.setTimeout(() => setStep('fear'), 200); }}
              />
            ))
          : FEARS.map((o) => (
              <Option
                key={o.v} on={fear === o.v} title={o.b} note={o.n}
                onClick={() => {
                  setFear(o.v);
                  const s = STAGES.find((x) => x.v === stage)!;
                  window.setTimeout(() => start({ stage: s.v, monthlyIncome: s.income, fear: o.v }), 200);
                }}
              />
            ))}
      </div>
    </div>
  );
}
