import { useMemo, useState } from 'react';
import { AlertTriangle, ArrowRight, Check, Search } from 'lucide-react';
import { INSTRUMENTS, type Category, type Instrument } from '@/data/instruments';
import { getMarketPath, priceOn } from '@/lib/market';
import { HORIZONS, REASONS, type HorizonId, type ReasonId } from '@/lib/types';
import { useStore } from '@/state/store';
import { inr, J, Option, pct, Sheet, SimBadge, Spark } from '@/components/ui';
import type { Snapshot } from '@/lib/dna';

const CATS: ('All' | Category)[] = ['All', 'Index Fund', 'Mutual Fund', 'Stock', 'Gold'];

export function Explore({ snap }: { snap: Snapshot }) {
  const { s } = useStore();
  const [cat, setCat] = useState<'All' | Category>('All');
  const [q, setQ] = useState('');
  const [detail, setDetail] = useState<Instrument | null>(null);
  const [buying, setBuying] = useState<Instrument | null>(null);

  const list = INSTRUMENTS.filter(
    (i) => (cat === 'All' || i.category === cat) && i.name.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="pad" style={{ paddingTop: 12 }}>
      <div className="row" style={{ background: 'var(--surface)', borderRadius: 12, padding: '0 14px', height: 46, marginBottom: 12 }}>
        <Search size={17} color="var(--ink-4)" />
        <input className="grow" placeholder="Search stocks and funds" value={q} onChange={(e) => setQ(e.target.value)} style={{ fontSize: 14 }} />
      </div>

      <div className="chips" style={{ marginBottom: 14 }}>
        {CATS.map((c) => (
          <button key={c} className={`chip ${cat === c ? 'on' : ''}`} onClick={() => setCat(c)}>{c}</button>
        ))}
      </div>

      <div className="card tint-amber" style={{ marginBottom: 14, padding: 12 }}>
        <div className="row top" style={{ gap: 9 }}>
          <AlertTriangle size={15} color="#9a6508" style={{ flex: 'none', marginTop: 1 }} />
          <p className="tiny" style={{ color: '#7a5206' }}>
            Prices here are simulated, not live. We show every instrument with its catch next to it,
            because the catch is the part beginners are never shown.
          </p>
        </div>
      </div>

      <div>
        {list.map((inst) => {
          const price = priceOn(s.regime, inst.id, s.day);
          const prev = priceOn(s.regime, inst.id, Math.max(0, s.day - 1));
          const chg = (price / prev - 1) * 100;
          const held = snap.positions.find((p) => p.lot.instrumentId === inst.id);
          return (
            <button key={inst.id} className="list-row" style={{ width: '100%', textAlign: 'left' }} onClick={() => setDetail(inst)}>
              <div className="avatar" style={{ background: inst.color }}>{inst.short.slice(0, 2)}</div>
              <div className="grow">
                <h4>{inst.name}</h4>
                <div className="row" style={{ gap: 6 }}>
                  <span className={`badge ${inst.risk.toLowerCase()}`}>{inst.risk}</span>
                  {held && <span className="tiny" style={{ color: 'var(--green-dark)', fontWeight: 600 }}>Held</span>}
                </div>
              </div>
              <div className="right">
                <b className="num">{inr(price, price < 100 ? 2 : 0)}</b>
                <span className={`num ${chg >= 0 ? 'pos' : 'neg'}`}>{pct(chg, 2)}</span>
              </div>
            </button>
          );
        })}
        {list.length === 0 && <p className="sub" style={{ textAlign: 'center', padding: 30 }}>Nothing matches that search.</p>}
      </div>

      {detail && (
        <DetailSheet
          inst={detail}
          onClose={() => setDetail(null)}
          onBuy={() => { setBuying(detail); setDetail(null); }}
        />
      )}
      {buying && <InvestSheet inst={buying} available={snap.cash} onClose={() => setBuying(null)} />}
    </div>
  );
}

function DetailSheet({ inst, onClose, onBuy }: { inst: Instrument; onClose: () => void; onBuy: () => void }) {
  const { s } = useStore();
  const path = getMarketPath(s.regime);
  const series = path.prices[inst.id].slice(0, Math.max(s.day + 1, 2));
  const price = series[series.length - 1];
  const chg = (price / series[0] - 1) * 100;

  return (
    <Sheet title={inst.name} onClose={onClose}>
      <div className="row" style={{ marginBottom: 12 }}>
        <div className="avatar" style={{ background: inst.color, width: 44, height: 44 }}>{inst.short.slice(0, 2)}</div>
        <div className="grow">
          <div className="hero-value num" style={{ fontSize: 26 }}>{inr(price, price < 100 ? 2 : 0)}</div>
          <span className={`num ${chg >= 0 ? 'pos' : 'neg'}`} style={{ fontSize: 13, fontWeight: 600 }}>
            {pct(chg)} since you started
          </span>
        </div>
        <SimBadge />
      </div>

      <div className="card" style={{ padding: '8px 8px 2px', marginBottom: 14 }}>
        <Spark data={series} height={96} />
      </div>

      <div className="card flat" style={{ marginBottom: 12 }}>
        <div className="tiny" style={{ fontWeight: 650, letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 5 }}>In one line</div>
        <p className="sub" style={{ color: 'var(--ink-2)', fontSize: 13.5 }}>{inst.plain}</p>
      </div>

      <div className="card tint-red" style={{ marginBottom: 14 }}>
        <div className="row" style={{ gap: 7, marginBottom: 5 }}>
          <AlertTriangle size={14} color="var(--red)" />
          <span className="tiny" style={{ fontWeight: 650, color: '#b8432a', letterSpacing: '.04em', textTransform: 'uppercase' }}>The catch</span>
        </div>
        <p className="sub" style={{ color: '#8f3620', fontSize: 13.5 }}>{inst.catch}</p>
      </div>

      <div className="stack sm" style={{ marginBottom: 18 }}>
        {[
          ['Category', inst.category],
          ['Sector', inst.sector],
          ['Risk', inst.risk],
          ['Moves with the market', inst.beta >= 1.2 ? 'More than the market' : inst.beta >= 0.8 ? 'About the same as the market' : inst.beta > 0 ? 'Less than the market' : 'Often the opposite way'],
        ].map(([k, v]) => (
          <div className="row between" key={k}>
            <span className="sub">{k === 'Moves with the market' ? <J t="beta">{k}</J> : k}</span>
            <b style={{ fontSize: 13.5, color: 'var(--ink)', fontWeight: 600 }}>{v}</b>
          </div>
        ))}
      </div>

      <button className="btn" onClick={onBuy}>Practice invest</button>
      <p className="tiny" style={{ textAlign: 'center', marginTop: 10 }}>
        Fake rupees. This is not an order and cannot become one.
      </p>
    </Sheet>
  );
}

/**
 * The Decision Journal. The amount is the easy part; the reason and the horizon
 * are what we actually keep. A user cannot complete the flow without naming
 * both, which is the single interaction this whole product is built around.
 */
function InvestSheet({ inst, available, onClose }: { inst: Instrument; available: number; onClose: () => void }) {
  const { s, buy } = useStore();
  const [amount, setAmount] = useState('10000');
  const [reasonId, setReasonId] = useState<ReasonId | null>(null);
  const [horizonId, setHorizonId] = useState<HorizonId | null>(null);
  const [stage, setStage] = useState<'amount' | 'why' | 'done'>('amount');

  const price = priceOn(s.regime, inst.id, s.day);
  const value = Number(amount.replace(/[^0-9]/g, '')) || 0;
  const tooMuch = value > available;
  const concentration = available > 0 ? (value / (available + 1)) * 100 : 0;

  const units = useMemo(() => (value / price).toFixed(price < 100 ? 2 : 3), [value, price]);

  if (stage === 'done') {
    return (
      <Sheet title="Recorded" onClose={onClose}>
        <div style={{ textAlign: 'center', padding: '10px 0 6px' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--green-soft)', display: 'grid', placeItems: 'center', margin: '0 auto 14px' }}>
            <Check size={28} color="var(--green-dark)" strokeWidth={3} />
          </div>
          <div className="h-section" style={{ fontSize: 17, marginBottom: 6 }}>{inr(value)} into {inst.name}</div>
          <p className="sub" style={{ maxWidth: 280, margin: '0 auto 18px' }}>
            We have saved your reason and your <J t="horizon">horizon</J>. When you next look at this
            holding, we will show you what you said here.
          </p>
        </div>
        <div className="card flat" style={{ marginBottom: 16 }}>
          <div className="row between" style={{ marginBottom: 8 }}>
            <span className="tiny">Why you bought</span>
            <b style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 600, textAlign: 'right' }}>{REASONS.find((r) => r.id === reasonId)!.label}</b>
          </div>
          <div className="row between">
            <span className="tiny">How long you plan to hold</span>
            <b style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 600 }}>{HORIZONS.find((h) => h.id === horizonId)!.label}</b>
          </div>
        </div>
        <button className="btn" onClick={onClose}>Done</button>
      </Sheet>
    );
  }

  if (stage === 'why') {
    return (
      <Sheet title="Why this one?" onClose={onClose}>
        <p className="sub" style={{ marginBottom: 14 }}>
          Pick the honest answer, not the impressive one. Nothing here is blocked and nothing is judged
          now &mdash; but we will show it back to you when the outcome arrives.
        </p>
        <div className="stack sm" style={{ marginBottom: 20 }}>
          {REASONS.map((r) => (
            <Option key={r.id} on={reasonId === r.id} onClick={() => setReasonId(r.id)} title={`${r.emoji}  ${r.label}`} />
          ))}
        </div>

        <div className="h-section" style={{ marginBottom: 4 }}>How long are you holding this?</div>
        <p className="tiny" style={{ marginBottom: 12 }}>
          This becomes a promise. Selling before it is up costs you Patience points, not money.
        </p>
        <div className="chips" style={{ marginBottom: 22, flexWrap: 'wrap' }}>
          {HORIZONS.map((h) => (
            <button key={h.id} className={`chip ${horizonId === h.id ? 'on' : ''}`} onClick={() => setHorizonId(h.id)}>{h.label}</button>
          ))}
        </div>

        <button
          className="btn"
          disabled={!reasonId || !horizonId}
          onClick={() => { buy(inst.id, value, reasonId!, horizonId!); setStage('done'); }}
        >
          Confirm practice investment
        </button>
        <button className="btn ghost" style={{ marginTop: 9 }} onClick={() => setStage('amount')}>Back</button>
      </Sheet>
    );
  }

  return (
    <Sheet title={`Practice invest in ${inst.short}`} onClose={onClose}>
      <div className="row between" style={{ marginBottom: 16 }}>
        <span className="sub">Practice cash available</span>
        <b className="num" style={{ fontSize: 14, color: 'var(--ink)' }}>{inr(available)}</b>
      </div>

      <div className="amount-field" style={{ marginBottom: 8, borderBottomColor: tooMuch ? 'var(--red)' : 'var(--green)' }}>
        <span>&#8377;</span>
        <input
          inputMode="numeric"
          value={value ? value.toLocaleString('en-IN') : ''}
          placeholder="0"
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
      <div className="row between" style={{ marginBottom: 14 }}>
        <span className="tiny">{tooMuch ? <span className="neg">More than your practice cash</span> : `≈ ${units} units at ${inr(price, 2)}`}</span>
        <SimBadge label="Fake money" />
      </div>

      <div className="chips" style={{ marginBottom: 16 }}>
        {[1000, 5000, 10000, 25000].map((v) => (
          <button key={v} className="chip" onClick={() => setAmount(String(v))}>{inr(v)}</button>
        ))}
        <button className="chip" onClick={() => setAmount(String(Math.floor(available)))}>All of it</button>
      </div>

      {concentration > 45 && !tooMuch && value > 0 && (
        <div className="card tint-amber" style={{ marginBottom: 16 }}>
          <p className="tiny" style={{ color: '#7a5206' }}>
            This would put {Math.round(concentration)}% of your remaining practice cash into one holding.
            That is allowed. It just means this one name will decide most of your result.
          </p>
        </div>
      )}

      <button className="btn" disabled={!value || tooMuch} onClick={() => setStage('why')}>
        Next: why this one? <ArrowRight size={17} />
      </button>
      <p className="tiny" style={{ textAlign: 'center', marginTop: 10 }}>
        Practice Mode cannot place a real order. No money leaves any account.
      </p>
    </Sheet>
  );
}
