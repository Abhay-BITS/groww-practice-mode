import { useState, type ReactNode } from 'react';
import { Check, ChevronLeft, Info, X } from 'lucide-react';
import { GLOSSARY } from '@/data/instruments';
import { useStore } from '@/state/store';

export const inr = (n: number, decimals = 0) =>
  `₹${n.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
export const signed = (n: number) => `${n >= 0 ? '+' : '−'}${inr(Math.abs(n))}`;
export const pct = (n: number, d = 1) => `${n >= 0 ? '+' : '−'}${Math.abs(n).toFixed(d)}%`;

export function AppBar({ title, onBack, right }: { title: string; onBack?: () => void; right?: ReactNode }) {
  return (
    <div className="appbar">
      {onBack && <button onClick={onBack} aria-label="Back"><ChevronLeft size={22} /></button>}
      <h2>{title}</h2>
      {right}
    </div>
  );
}

export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-grab" />
        <div className="sheet-head">
          <h3>{title}</h3>
          <button onClick={onClose} aria-label="Close"><X size={20} /></button>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  );
}

export function Modal({ children, onClose }: { children: ReactNode; onClose?: () => void }) {
  return (
    <div className="scrim center" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}

/** Any word a first-time investor would have to look up. One tap, one sentence. */
export function J({ t, children }: { t: keyof typeof GLOSSARY | string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { markGlossary } = useStore();
  const text = GLOSSARY[t];
  if (!text) return <>{children}</>;
  return (
    <>
      <span className="jargon" onClick={(e) => { e.stopPropagation(); setOpen(true); markGlossary(t); }}>{children}</span>
      {open && (
        <Modal onClose={() => setOpen(false)}>
          <div className="row" style={{ marginBottom: 10 }}>
            <Info size={18} color="var(--blue)" />
            <b style={{ fontSize: 16, color: 'var(--ink)', textTransform: 'capitalize' }}>{t}</b>
          </div>
          <p className="sub" style={{ fontSize: 14, marginBottom: 18 }}>{text}</p>
          <button className="btn ghost" onClick={() => setOpen(false)}>Got it</button>
        </Modal>
      )}
    </>
  );
}

export function SimBadge({ label = 'Simulated' }: { label?: string }) {
  return <span className="badge sim">{label}</span>;
}

export function Option({ on, onClick, title, note }: { on: boolean; onClick: () => void; title: ReactNode; note?: ReactNode }) {
  return (
    <button className={`option ${on ? 'on' : ''}`} onClick={onClick}>
      <div className="grow">
        <b>{title}</b>
        {note && <span>{note}</span>}
      </div>
      <div className="tick">{on && <Check size={13} strokeWidth={3} />}</div>
    </button>
  );
}

export function Meter({ value, color }: { value: number; color: string }) {
  return <div className="meter"><i style={{ width: `${Math.max(2, value)}%`, background: color }} /></div>;
}

export function scoreColor(score: number) {
  if (score >= 70) return 'var(--green)';
  if (score >= 45) return 'var(--amber)';
  if (score > 0) return 'var(--red)';
  return 'var(--line)';
}

/** Score ring. Used for Investor DNA on Home and on the DNA screen. */
export function Ring({ score, size = 112, stroke = 10, label }: { score: number; size?: number; stroke?: number; label?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={scoreColor(score)} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)}
          style={{ transition: 'stroke-dashoffset .7s cubic-bezier(.22,.9,.3,1)' }}
        />
      </svg>
      <b style={{ fontSize: size / 4.6 }}>
        {score}
        {label && <small>{label}</small>}
      </b>
    </div>
  );
}

/** Area sparkline. Pure SVG so it stays sharp and needs no chart dependency. */
export function Spark({ data, height = 90, color, fill = true, markers = [] }: {
  data: number[]; height?: number; color?: string; fill?: boolean;
  markers?: { at: number; tone: 'good' | 'bad' | 'info' }[];
}) {
  if (data.length < 2) return <div style={{ height }} />;
  const w = 320;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const x = (i: number) => (i / (data.length - 1)) * w;
  const y = (v: number) => height - 6 - ((v - min) / span) * (height - 14);
  const stroke = color ?? (data[data.length - 1] >= data[0] ? 'var(--green)' : 'var(--red)');
  const line = data.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const gid = `g${Math.round(Math.abs(data[0] * 97) % 9999)}`;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} width="100%" height={height} preserveAspectRatio="none" style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.22" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={`${line} L${w},${height} L0,${height} Z`} fill={`url(#${gid})`} />}
      <path d={line} fill="none" stroke={stroke} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      {markers.filter((m) => m.at < data.length).map((m, i) => (
        <circle
          key={i} cx={x(m.at)} cy={y(data[m.at])} r="4"
          fill={m.tone === 'bad' ? 'var(--red)' : m.tone === 'good' ? 'var(--green)' : 'var(--blue)'}
          stroke="#fff" strokeWidth="2"
        />
      ))}
    </svg>
  );
}

/** Allocation donut. Segments are drawn as stroked arcs on one circle. */
export function Donut({ slices, size = 128 }: { slices: { value: number; color: string }[]; size?: number }) {
  const total = slices.reduce((t, s) => t + s.value, 0) || 1;
  const stroke = 18;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flex: 'none' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={stroke} />
      {slices.map((s, i) => {
        const len = (s.value / total) * c;
        const el = (
          <circle
            key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={s.color} strokeWidth={stroke}
            strokeDasharray={`${Math.max(len - 2, 0)} ${c}`} strokeDashoffset={-offset}
            style={{ transition: 'stroke-dasharray .5s, stroke-dashoffset .5s' }}
          />
        );
        offset += len;
        return el;
      })}
    </svg>
  );
}

export function Empty({ icon, title, body, cta }: { icon: ReactNode; title: string; body: string; cta?: ReactNode }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 16px' }}>
      <div style={{ width: 56, height: 56, borderRadius: 18, background: 'var(--surface)', display: 'grid', placeItems: 'center', margin: '0 auto 14px', color: 'var(--ink-4)' }}>
        {icon}
      </div>
      <div className="h-section" style={{ marginBottom: 6 }}>{title}</div>
      <p className="sub" style={{ maxWidth: 270, margin: '0 auto 18px' }}>{body}</p>
      {cta}
    </div>
  );
}
