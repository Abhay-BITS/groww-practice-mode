import { useState } from 'react';
import { Check, GraduationCap, Lock, ShieldCheck } from 'lucide-react';
import { byId } from '@/data/instruments';
import { overall, traits, type Snapshot } from '@/lib/dna';
import { useStore } from '@/state/store';
import { inr, Modal, Ring } from '@/components/ui';

/**
 * The bridge. Practice Mode is not a place to live -- it is a fourteen-day
 * programme that ends in a real, small, automatic SIP. The allocation the user
 * built with fake money is carried over, so the first real decision is one they
 * have already made and already seen the consequences of.
 */
const MIN_SIP = 100;

export function Graduate({ snap }: { snap: Snapshot }) {
  const { s, set } = useStore();
  const [amount, setAmount] = useState(500);
  const [confirm, setConfirm] = useState(false);
  const list = traits(s, snap);
  const dna = overall(list);

  const gates = [
    { label: 'Make at least two practice investments', done: s.trades.filter((t) => t.kind === 'buy').length >= 2 },
    { label: 'Hold through one market fall', done: s.panics.length > 0 },
    { label: 'Reach an Investor DNA of 60', done: dna >= 60, detail: `You are at ${dna}` },
    { label: 'Spread across more than one category', done: new Set(snap.positions.map((p) => byId(p.lot.instrumentId).category)).size > 1 },
  ];
  const ready = gates.every((g) => g.done);

  // Funds only. We will not carry an individual stock into someone's first real
  // investment, whatever their practice portfolio says.
  const carryable = snap.positions.filter((p) => byId(p.lot.instrumentId).category !== 'Stock');
  const carryTotal = carryable.reduce((t, p) => t + p.value, 0);

  if (s.graduated) {
    return (
      <div className="pad" style={{ paddingTop: 30, textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--green-soft)', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
          <Check size={32} color="var(--green-dark)" strokeWidth={3} />
        </div>
        <div className="h-screen" style={{ marginBottom: 8 }}>Your {inr(amount)} SIP is set up</div>
        <p className="sub" style={{ maxWidth: 290, margin: '0 auto 22px' }}>
          It runs on the 5th of every month. You can pause or change it any time, and Practice Mode stays
          here for whenever you want to try something before doing it for real.
        </p>
        <div className="card flat" style={{ textAlign: 'left' }}>
          <div className="tiny" style={{ fontWeight: 650, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 10 }}>What you are actually buying</div>
          {carryable.map((p) => {
            const inst = byId(p.lot.instrumentId);
            const share = carryTotal ? p.value / carryTotal : 0;
            return (
              <div className="row between" key={p.lot.instrumentId} style={{ padding: '7px 0' }}>
                <span className="sub" style={{ color: 'var(--ink-2)' }}>{inst.name}</span>
                <b className="num" style={{ fontSize: 13.5, color: 'var(--ink)' }}>{inr(Math.round(amount * share))}/mo</b>
              </div>
            );
          })}
        </div>
        <p className="tiny" style={{ marginTop: 18 }}>
          This prototype stops here. In the real app this hands off to Groww&rsquo;s existing KYC and
          mandate flow, which is already built.
        </p>
      </div>
    );
  }

  return (
    <div className="pad" style={{ paddingTop: 18 }}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ display: 'inline-block', marginBottom: 12 }}><Ring score={dna} size={96} stroke={9} /></div>
        <div className="h-screen" style={{ fontSize: 21, marginBottom: 8 }}>
          {ready ? 'You are ready for real money' : 'Four things before real money'}
        </div>
        <p className="sub" style={{ maxWidth: 300, margin: '0 auto' }}>
          Practice Mode is not meant to be permanent. The point was always to get you to a first real
          investment small enough that it cannot hurt you.
        </p>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        {gates.map((g, i) => (
          <div className="row" key={g.label} style={{ padding: '10px 0', borderTop: i ? '1px solid var(--line-2)' : 'none' }}>
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
          <div className="card tint-green" style={{ marginBottom: 18 }}>
            <div className="row" style={{ gap: 8, marginBottom: 7 }}>
              <GraduationCap size={17} color="var(--green-dark)" />
              <b style={{ fontSize: 14.5, color: 'var(--ink)', fontWeight: 700 }}>Carry your practice portfolio over</b>
            </div>
            <p className="sub" style={{ fontSize: 13 }}>
              We will use the fund allocation you built with fake rupees as the starting point for a real
              monthly SIP. Individual stocks are not carried over &mdash; a first real investment should not
              depend on one company.
            </p>
          </div>

          <div className="h-section" style={{ marginBottom: 4 }}>How much, every month?</div>
          <p className="tiny" style={{ marginBottom: 12 }}>
            Start at an amount you would not notice disappearing. You can raise it later; almost nobody
            regrets starting too small.
          </p>
          <div className="chips" style={{ marginBottom: 16 }}>
            {[100, 250, 500, 1000, 2500].map((v) => (
              <button key={v} className={`chip ${amount === v ? 'on' : ''}`} onClick={() => setAmount(v)}>{inr(v)}/mo</button>
            ))}
          </div>

          <div className="card" style={{ marginBottom: 18 }}>
            <div className="tiny" style={{ fontWeight: 650, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 10 }}>Your real SIP would be</div>
            {carryable.length === 0 && <p className="sub" style={{ fontSize: 13 }}>You only hold individual stocks in practice. Add a fund before graduating.</p>}
            {carryable.map((p) => {
              const inst = byId(p.lot.instrumentId);
              const share = carryTotal ? p.value / carryTotal : 0;
              return (
                <div className="row between" key={p.lot.instrumentId} style={{ padding: '7px 0' }}>
                  <div className="row" style={{ gap: 9 }}>
                    <div className="avatar" style={{ background: inst.color, width: 30, height: 30, fontSize: 9 }}>{inst.short.slice(0, 2)}</div>
                    <span className="sub" style={{ color: 'var(--ink-2)' }}>{inst.name}</span>
                  </div>
                  <b className="num" style={{ fontSize: 13.5, color: 'var(--ink)' }}>{inr(Math.round(amount * share))}</b>
                </div>
              );
            })}
          </div>

          <button className="btn" disabled={carryable.length === 0 || amount < MIN_SIP} onClick={() => setConfirm(true)}>
            Start a real {inr(amount)} SIP
          </button>
          <div className="row top" style={{ gap: 7, marginTop: 14 }}>
            <ShieldCheck size={13} color="var(--ink-4)" style={{ flex: 'none', marginTop: 2 }} />
            <p className="tiny">
              This is where the prototype hands off. Real investing requires KYC, a bank mandate and a risk
              disclosure, and nothing in Practice Mode substitutes for any of them. Mutual fund investments
              are subject to market risks.
            </p>
          </div>
        </>
      )}

      {!ready && (
        <div className="card flat">
          <p className="sub" style={{ fontSize: 13 }}>
            These gates are not busywork. Each one maps to a habit that predicts whether a first-time
            investor is still invested a year later: having made more than one decision, having survived a
            fall without selling, having spread the money, and having reasons they can repeat.
          </p>
        </div>
      )}

      {confirm && (
        <Modal onClose={() => setConfirm(false)}>
          <div className="h-section" style={{ fontSize: 17, marginBottom: 8 }}>This is a prototype</div>
          <p className="sub" style={{ marginBottom: 18 }}>
            No real SIP will be created and no money will move. Continuing just shows you what the
            confirmation screen would look like.
          </p>
          <button className="btn" onClick={() => { set({ graduated: true }); setConfirm(false); }}>Show me the screen</button>
          <button className="btn ghost" style={{ marginTop: 9 }} onClick={() => setConfirm(false)}>Cancel</button>
        </Modal>
      )}
    </div>
  );
}
