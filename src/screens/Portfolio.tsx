import { useState } from 'react';
import { Compass, Lightbulb, PieChart, RotateCcw } from 'lucide-react';
import { byId } from '@/data/instruments';
import { portfolioInsights, type Position, type Snapshot } from '@/lib/dna';
import { horizon, reason, type Trade } from '@/lib/types';
import { dayLabel } from '@/lib/market';
import { useStore } from '@/state/store';
import { Avatar, Confirm, Donut, Empty, inr, J, Option, pct, Sheet, signed } from '@/components/ui';
import type { Tab } from '@/App';

export function Portfolio({ snap, go }: { snap: Snapshot; go: (t: Tab) => void }) {
  const { s, reset } = useStore();
  const [open, setOpen] = useState<Position | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const insights = portfolioInsights(s, snap);

  if (!snap.positions.length) {
    return (
      <div className="pad">
        <Empty
          icon={<PieChart size={26} />}
          title="Nothing in here yet"
          body="Nothing invested yet. Once you put some practice money to work, this page explains what your choices are doing."
          cta={<button className="btn sm" onClick={() => go('explore')}><Compass size={15} /> Explore investments</button>}
        />
      </div>
    );
  }

  return (
    <div className="pad" style={{ paddingTop: 16 }}>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="row" style={{ gap: 18 }}>
          <Donut slices={snap.positions.map((p) => ({ value: p.value, color: byId(p.lot.instrumentId).color }))} size={110} />
          <div className="grow stack sm">
            <div>
              <div className="tiny">Current value</div>
              <b className="num" style={{ fontSize: 20, color: 'var(--ink)', letterSpacing: '-0.02em' }}>{inr(snap.value)}</b>
            </div>
            <div>
              <div className="tiny">Returns</div>
              <b className={`num ${snap.value >= snap.invested ? 'pos' : 'neg'}`} style={{ fontSize: 15 }}>
                {signed(snap.value - snap.invested)} ({pct(snap.invested ? (snap.value / snap.invested - 1) * 100 : 0)})
              </b>
            </div>
          </div>
        </div>
      </div>

      <div className="h-section" style={{ marginBottom: 4 }}>Your <J t="allocation">allocation</J></div>
      <p className="tiny" style={{ marginBottom: 6 }}>Tap any holding to see what you said when you bought it.</p>
      <div style={{ marginBottom: 20 }}>
        {snap.positions.map((p) => {
          const inst = byId(p.lot.instrumentId);
          return (
            <button key={p.lot.instrumentId} className="list-row" style={{ width: '100%', textAlign: 'left' }} onClick={() => setOpen(p)}>
              <Avatar id={inst.id} />
              <div className="grow">
                <h4>{inst.name}</h4>
                <span className="tiny num">{Math.round(p.weight)}% &middot; {inr(p.invested)} invested</span>
              </div>
              <div className="right">
                <b className="num">{inr(p.value)}</b>
                <span className={`num ${p.pnl >= 0 ? 'pos' : 'neg'}`}>{pct(p.pnlPct)}</span>
              </div>
            </button>
          );
        })}
      </div>

      {insights.length > 0 && (
        <>
          <div className="row" style={{ gap: 7, marginBottom: 10 }}>
            <Lightbulb size={16} color="var(--amber)" />
            <div className="h-section">What your portfolio is telling you</div>
          </div>
          <div className="stack" style={{ marginBottom: 20 }}>
            {insights.map((i) => (
              <div key={i.title} className={`card ${i.tone === 'warn' ? 'tint-amber' : i.tone === 'good' ? 'tint-green' : 'flat'}`}>
                <b style={{ fontSize: 13.5, color: 'var(--ink)', fontWeight: 650, display: 'block', marginBottom: 5 }}>{i.title}</b>
                <p className="sub" style={{ fontSize: 13 }}>{i.body}</p>
              </div>
            ))}
          </div>
          <p className="tiny" style={{ marginBottom: 20 }}>
            These describe what your mix is doing. They aren&rsquo;t suggestions for what to do next.
          </p>
        </>
      )}

      <button className="btn danger" onClick={() => setConfirmReset(true)}>
        <RotateCcw size={16} /> Reset practice portfolio
      </button>

      {open && <HoldingSheet pos={open} onClose={() => setOpen(null)} />}

      {confirmReset && (
        <Confirm
          title="Start the year again?"
          body="Holdings, trades, your journal and your Investor DNA all go back to zero, and you get the full ₹1,00,000 again. Your salary plan stays."
          yes="Reset everything" no="Keep my run" danger
          onYes={() => { reset(); setConfirmReset(false); go('home'); }}
          onNo={() => setConfirmReset(false)}
        />
      )}
    </div>
  );
}

/**
 * The thesis mirror. Every holding carries the sentence the user wrote when
 * they bought it, held up against what the position has actually done since.
 */
function HoldingSheet({ pos, onClose }: { pos: Position; onClose: () => void }) {
  const { s, sell } = useStore();
  const [selling, setSelling] = useState(false);
  const [exit, setExit] = useState<Trade['exitReason'] | null>(null);
  const inst = byId(pos.lot.instrumentId);
  const h = horizon(pos.lot.horizonId);
  const r = reason(pos.lot.reasonId);
  const held = s.day - pos.lot.openedDay;
  const early = held < h.days;

  if (selling) {
    return (
      <Sheet title={`Sell ${inst.name}`} onClose={onClose}>
        {early && (
          <div className="card tint-amber" style={{ marginBottom: 16 }}>
            <b style={{ fontSize: 13.5, color: 'var(--ink)', fontWeight: 650, display: 'block', marginBottom: 5 }}>
              You said you would hold this for {h.label.toLowerCase()}
            </b>
            <p className="sub" style={{ fontSize: 13, color: '#7a5206' }}>
              It&rsquo;s been {held} trading days. You can still sell. It&rsquo;ll just count against
              Patience and show up in your replay.
            </p>
          </div>
        )}
        <div className="h-section" style={{ marginBottom: 10 }}>Why are you selling?</div>
        <div className="stack sm" style={{ marginBottom: 20 }}>
          <Option on={exit === 'target'} onClick={() => setExit('target')} title="I got what I came for" note="The reason I bought it has played out" />
          <Option on={exit === 'scared'} onClick={() => setExit('scared')} title="It's falling and I want out" note="Most people feel this. Few say it" />
          <Option on={exit === 'needed'} onClick={() => setExit('needed')} title="I need the money for something else" note="A plan changed, not a view" />
          <Option on={exit === 'wrong'} onClick={() => setExit('wrong')} title="I was wrong about this one" note="My original reason no longer holds" />
        </div>
        <button className="btn danger" disabled={!exit} onClick={() => { sell(pos.lot.instrumentId, pos.lot.units, exit!); onClose(); }}>
          Sell all {inr(pos.value)}
        </button>
        <button className="btn ghost" style={{ marginTop: 9 }} onClick={() => setSelling(false)}>Keep holding</button>
      </Sheet>
    );
  }

  return (
    <Sheet title={inst.name} onClose={onClose}>
      <div className="card flat" style={{ marginBottom: 16 }}>
        <div className="row between" style={{ marginBottom: 10 }}>
          <div>
            <div className="tiny">Value now</div>
            <b className="num" style={{ fontSize: 18, color: 'var(--ink)' }}>{inr(pos.value)}</b>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="tiny">You put in</div>
            <b className="num" style={{ fontSize: 18, color: 'var(--ink)' }}>{inr(pos.invested)}</b>
          </div>
        </div>
        <div className={`num ${pos.pnl >= 0 ? 'pos' : 'neg'}`} style={{ fontSize: 14, fontWeight: 650 }}>
          {signed(pos.pnl)} ({pct(pos.pnlPct)})
        </div>
      </div>

      <div className="card tint-blue" style={{ marginBottom: 16 }}>
        <div className="tiny" style={{ fontWeight: 650, letterSpacing: '.04em', textTransform: 'uppercase', color: '#3d4ed6', marginBottom: 8 }}>
          What you said on {dayLabel(pos.lot.openedDay)}
        </div>
        <p style={{ fontSize: 15, color: 'var(--ink)', fontWeight: 600, lineHeight: 1.45, marginBottom: 8 }}>
          &ldquo;{r.label}&rdquo;
        </p>
        <p className="sub" style={{ fontSize: 13 }}>
          You set a <J t="horizon">horizon</J> of {h.label.toLowerCase()}. {held} trading days have passed.
        </p>
      </div>

      <div className="card flat" style={{ marginBottom: 18 }}>
        <p className="sub" style={{ fontSize: 13 }}>
          {early
            ? `It will move around a lot before your horizon is up. Most of those moves say more about the market's mood than about ${inst.name}.`
            : `Your horizon is up. Worth asking whether the reason you wrote down still holds, rather than whether the price went your way.`}
        </p>
      </div>

      <button className="btn ghost" onClick={() => setSelling(true)}>Sell this holding</button>
    </Sheet>
  );
}
