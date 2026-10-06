import { useMemo, useState } from 'react';
import { Check, Lock, ShieldCheck } from 'lucide-react';
import { byId } from '@/data/instruments';
import { gates, overall, traits, type Snapshot } from '@/lib/dna';
import { useStore } from '@/state/store';
import { Avatar, Confirm, inr, Ring } from '@/components/ui';
import { MIN_PER_FUND, splitSip } from '@/lib/sip';

export function Graduate({ snap }: { snap: Snapshot }) {
  const { s, set } = useStore();
  const suggested = s.plan?.invest ?? 500;
  const options = useMemo(() => [...new Set([100, 250, 500, 1000, 2500, suggested])].sort((a, b) => a - b), [suggested]);
  const [amount, setAmount] = useState(suggested);
  const [confirm, setConfirm] = useState(false);
  const dna = overall(traits(s, snap));
  const list = gates(s, snap);
  const ready = list.every((g) => g.done);

  // Funds only. A first real investment should not rest on one company,
  // whatever the practice portfolio held.
  const funds = snap.positions
    .filter((p) => byId(p.lot.instrumentId).category !== 'Stock')
    .map((p) => ({ id: p.lot.instrumentId, value: p.value }));
  const { parts, dropped } = splitSip(amount, funds);
  const stocksLeft = snap.positions.filter((p) => byId(p.lot.instrumentId).category === 'Stock').length;

  if (s.graduated) {
    return (
      <div className="pad" style={{ paddingTop: 30, textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--green-soft)', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
          <Check size={32} color="var(--green-dark)" strokeWidth={3} />
        </div>
        <div className="h-screen" style={{ marginBottom: 8 }}>{inr(amount)} a month, starting the 5th</div>
        <p className="sub" style={{ maxWidth: 290, margin: '0 auto 22px' }}>
          You can pause or change it whenever you like. Practice Mode stays here for anything you want to
          try first.
        </p>
        <div className="card flat" style={{ textAlign: 'left' }}>
          {parts.map((p) => (
            <div className="row between" key={p.id} style={{ padding: '7px 0' }}>
              <span className="sub" style={{ color: 'var(--ink-2)' }}>{byId(p.id).name}</span>
              <b className="num" style={{ fontSize: 13.5, color: 'var(--ink)' }}>{inr(p.amount)}/mo</b>
            </div>
          ))}
        </div>
        <p className="tiny" style={{ marginTop: 18 }}>
          The prototype ends here. In the real app this would hand over to Groww&rsquo;s existing KYC and
          mandate flow.
        </p>
      </div>
    );
  }

  return (
    <div className="pad" style={{ paddingTop: 18 }}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ display: 'inline-block', marginBottom: 12 }}><Ring score={dna} size={96} stroke={9} /></div>
        <div className="h-screen" style={{ fontSize: 21, marginBottom: 8 }}>
          {ready ? "You're ready for real money" : 'Before real money'}
        </div>
        <p className="sub" style={{ maxWidth: 300, margin: '0 auto' }}>
          {ready
            ? 'Practice was never meant to be where you stay. This is the small, real first step it was building towards.'
            : 'Four things first. Each one is a habit that tends to separate people still investing a year later from people who stopped.'}
        </p>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        {list.map((g, i) => (
          <div className="row" key={g.id} style={{ padding: '10px 0', borderTop: i ? '1px solid var(--line-2)' : 'none' }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', flex: 'none', display: 'grid', placeItems: 'center', background: g.done ? 'var(--green)' : 'var(--surface-2)', color: g.done ? '#fff' : 'var(--ink-4)' }}>
              {g.done ? <Check size={13} strokeWidth={3} /> : <Lock size={11} />}
            </div>
            <div className="grow">
              <span style={{ fontSize: 13.5, color: g.done ? 'var(--ink)' : 'var(--ink-3)', fontWeight: g.done ? 600 : 500 }}>{g.label}</span>
              {!g.done && g.detail && <div className="tiny">{g.detail}</div>}
            </div>
          </div>
        ))}
      </div>

      {ready && (
        <>
          <div className="h-section" style={{ marginBottom: 4 }}>How much a month?</div>
          <p className="tiny" style={{ marginBottom: 12 }}>
            {s.plan
              ? `${inr(s.plan.invest)} is what you set aside in your salary plan. Starting lower is fine, you can raise it later.`
              : 'Pick an amount you would not notice leaving. You can raise it later.'}
          </p>
          <div className="chips" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
            {options.map((v) => (
              <button key={v} className={`chip ${amount === v ? 'on' : ''}`} onClick={() => setAmount(v)}>
                {inr(v)}{v === s.plan?.invest ? ' · your plan' : ''}
              </button>
            ))}
          </div>

          <div className="card" style={{ marginBottom: 12 }}>
            <div className="tiny" style={{ fontWeight: 650, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 10 }}>Your real SIP, from what you practised with</div>
            {parts.length === 0 && <p className="sub" style={{ fontSize: 13 }}>You only hold individual stocks in practice. Add a fund before you graduate.</p>}
            {parts.map((p) => (
              <div className="row between" key={p.id} style={{ padding: '7px 0' }}>
                <div className="row" style={{ gap: 9 }}>
                  <Avatar id={p.id} size={30} />
                  <span className="sub" style={{ color: 'var(--ink-2)' }}>{byId(p.id).name}</span>
                </div>
                <b className="num" style={{ fontSize: 13.5, color: 'var(--ink)' }}>{inr(p.amount)}</b>
              </div>
            ))}
          </div>
          <div className="stack sm" style={{ marginBottom: 18 }}>
            {dropped > 0 && (
              <p className="tiny">
                Most funds need at least {inr(MIN_PER_FUND)} a month, so at {inr(amount)} we&rsquo;ve kept your{' '}
                {parts.length === 1 ? 'largest fund only' : `${parts.length} largest funds`}. Go higher to include the rest.
              </p>
            )}
            {stocksLeft > 0 && (
              <p className="tiny">
                Your {stocksLeft} practice stock{stocksLeft > 1 ? 's are' : ' is'} left out on purpose. A first real
                investment shouldn&rsquo;t depend on one company.
              </p>
            )}
          </div>

          <button className="btn" disabled={parts.length === 0} onClick={() => setConfirm(true)}>
            Start a {inr(amount)} monthly SIP
          </button>
          <div className="row top" style={{ gap: 7, marginTop: 14 }}>
            <ShieldCheck size={13} color="var(--ink-4)" style={{ flex: 'none', marginTop: 2 }} />
            <p className="tiny">Mutual fund investments are subject to market risks. Real investing needs KYC and a bank mandate.</p>
          </div>
        </>
      )}

      {confirm && (
        <Confirm
          title="This is where the prototype stops"
          body="No real SIP gets created and no money moves. Continuing shows you the confirmation screen it would lead to."
          yes="Show me" onYes={() => { set({ graduated: true }); setConfirm(false); }}
          onNo={() => setConfirm(false)}
        />
      )}
    </div>
  );
}
