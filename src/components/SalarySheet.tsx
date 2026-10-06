import { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { inr, Sheet } from '@/components/ui';
import { useStore } from '@/state/store';
import { defaultPlan, STEP } from '@/lib/plan';
import type { SalaryPlan } from '@/lib/types';


const ROWS: { key: 'buffer' | 'wants' | 'invest'; label: string; hint: string; color: string }[] = [
  { key: 'buffer', label: 'Safety buffer', hint: 'Savings account. For the month something goes wrong.', color: 'var(--blue)' },
  { key: 'wants', label: 'Wants', hint: 'Eating out, trips, the things that make the job worth it.', color: 'var(--amber)' },
  { key: 'invest', label: 'Invest', hint: 'Money you will not touch for at least three years.', color: 'var(--green)' },
];

/**
 * The first-salary moment, made concrete. Needs is whatever is left, so moving
 * any other bar visibly squeezes rent and food, which is the trade-off a first
 * salary actually involves.
 */
export function SalarySheet({ onClose }: { onClose: () => void }) {
  const { s, setPlan } = useStore();
  const income = s.profile?.monthlyIncome ?? 32000;
  const [plan, set] = useState<SalaryPlan>(s.plan ?? defaultPlan(income));

  const bump = (key: 'buffer' | 'wants' | 'invest', delta: number) => {
    set((p) => {
      const next = Math.max(0, p[key] + delta);
      const needs = income - (key === 'buffer' ? next : p.buffer) - (key === 'wants' ? next : p.wants) - (key === 'invest' ? next : p.invest);
      if (needs < 0) return p;
      return { ...p, [key]: next, needs };
    });
  };

  const tight = plan.needs < income * 0.4;
  const months = plan.buffer > 0 ? Math.ceil((plan.needs * 3) / plan.buffer) : null;
  const pctOf = (n: number) => `${(n / income) * 100}%`;

  return (
    <Sheet title={`Your ${inr(income)}. Where does it go?`} onClose={onClose}>
      <p className="sub" style={{ marginBottom: 14 }}>
        This one is about your real salary, not the practice money. Most of it shouldn&rsquo;t be invested,
        and that&rsquo;s fine.
      </p>

      <div className="split-bar" style={{ marginBottom: 8 }}>
        <i style={{ width: pctOf(plan.needs), background: 'var(--ink-4)' }} />
        <i style={{ width: pctOf(plan.buffer), background: 'var(--blue)' }} />
        <i style={{ width: pctOf(plan.wants), background: 'var(--amber)' }} />
        <i style={{ width: pctOf(plan.invest), background: 'var(--green)' }} />
      </div>

      <div className="row between" style={{ padding: '12px 0', borderBottom: '1px solid var(--line-2)' }}>
        <div>
          <b style={{ fontSize: 14, color: 'var(--ink)', fontWeight: 600 }}>Needs</b>
          <div className="tiny">Rent, food, travel, bills. Whatever is left over.</div>
        </div>
        <b className={`num ${tight ? 'neg' : ''}`} style={{ fontSize: 15, color: tight ? undefined : 'var(--ink)' }}>{inr(plan.needs)}</b>
      </div>

      {ROWS.map((r) => (
        <div key={r.key} className="row" style={{ padding: '12px 0', borderBottom: '1px solid var(--line-2)' }}>
          <i style={{ width: 8, height: 8, borderRadius: 99, background: r.color, flex: 'none' }} />
          <div className="grow">
            <b style={{ fontSize: 14, color: 'var(--ink)', fontWeight: 600 }}>{r.label}</b>
            <div className="tiny">{r.hint}</div>
          </div>
          <div className="stepper">
            <button onClick={() => bump(r.key, -STEP)} disabled={plan[r.key] === 0} aria-label={`Less ${r.label}`}><Minus size={14} /></button>
            <b className="num">{inr(plan[r.key])}</b>
            <button onClick={() => bump(r.key, STEP)} disabled={plan.needs < STEP} aria-label={`More ${r.label}`}><Plus size={14} /></button>
          </div>
        </div>
      ))}

      <div className="stack sm" style={{ margin: '16px 0 18px' }}>
        {tight && (
          <div className="card tint-red" style={{ padding: 12 }}>
            <p className="tiny" style={{ color: '#8f3620' }}>
              That leaves {inr(plan.needs)} for rent, food and travel. For most first salaries that&rsquo;s too
              tight to last, and the first bad month will come out of your investments.
            </p>
          </div>
        )}
        <div className="card flat" style={{ padding: 12 }}>
          <p className="tiny" style={{ color: 'var(--ink-2)' }}>
            {months === null
              ? 'With no buffer, any surprise expense has to come out of what you invested, usually at a bad moment.'
              : `At ${inr(plan.buffer)} a month, you'd have three months of needs saved in ${months} month${months === 1 ? '' : 's'}. That's the point where investing gets safe to keep doing.`}
          </p>
        </div>
        {plan.invest > 0 && (
          <div className="card tint-green" style={{ padding: 12 }}>
            <p className="tiny" style={{ color: '#0a6a53' }}>
              {inr(plan.invest)} a month is what we&rsquo;ll suggest for your real SIP, if you graduate.
            </p>
          </div>
        )}
      </div>

      <button className="btn" onClick={() => { setPlan(plan); onClose(); }}>Save my plan</button>
    </Sheet>
  );
}
