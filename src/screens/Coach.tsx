import { useEffect, useRef, useState } from 'react';
import { ArrowUp, ShieldCheck, Sparkles } from 'lucide-react';
import { respond, SUGGESTIONS, type CoachReply } from '@/lib/coach';
import { useStore } from '@/state/store';
import type { Snapshot } from '@/lib/dna';

type Msg = { role: 'ai' | 'me'; text: string; guard?: CoachReply['guard'] };

const GUARD_LABEL: Record<NonNullable<CoachReply['guard']>, string> = {
  'no-recommendation': 'Won\u2019t pick for you',
  'no-guarantee': 'Won\u2019t promise returns',
  'no-prediction': 'Won\u2019t predict prices',
  'no-instruction': 'Won\u2019t say buy or sell',
  injection: 'Won\u2019t change its rules',
  chasing: 'Chasing returns',
  'off-topic': 'Outside what it covers',
};

export function Coach({ snap }: { snap: Snapshot }) {
  const { s } = useStore();
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: 'ai',
      text: 'Ask me how anything works, or why your practice portfolio moved. I won\u2019t pick investments, predict prices or promise returns, because nobody can do those honestly.',
    },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, typing]);

  const send = (text: string) => {
    const clean = text.trim();
    if (!clean || typing) return;
    setMsgs((m) => [...m, { role: 'me', text: clean }]);
    setInput('');
    setTyping(true);
    window.setTimeout(() => {
      const r = respond(clean, s, snap);
      setMsgs((m) => [...m, { role: 'ai', text: r.text, guard: r.guard }]);
      setTyping(false);
    }, 480);
  };

  return (
    <div className="pad" style={{ paddingTop: 14, display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <div className="card tint-blue" style={{ marginBottom: 14, padding: 12 }}>
        <div className="row top" style={{ gap: 9 }}>
          <ShieldCheck size={15} color="var(--blue)" style={{ flex: 'none', marginTop: 1 }} />
          <p className="tiny" style={{ color: '#3a44a8' }}>
            When the coach declines something, the label above its reply says what and why.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, marginBottom: 10 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'me' ? 'flex-end' : 'flex-start', gap: 4 }}>
            {m.guard && (
              <span className="badge" style={{ background: 'var(--surface-2)', color: 'var(--ink-3)' }}>{GUARD_LABEL[m.guard]}</span>
            )}
            <div className={`bubble ${m.role}`} style={{ whiteSpace: 'pre-line' }}>{m.text}</div>
          </div>
        ))}
        {typing && (
          <div className="bubble ai alarm" style={{ alignSelf: 'flex-start' }}>
            <Sparkles size={14} style={{ verticalAlign: -2 }} /> thinking
          </div>
        )}
        <div ref={endRef} />
      </div>

      {msgs.length <= 3 && (
        <div className="chips" style={{ marginBottom: 10, flexWrap: 'wrap' }}>
          {SUGGESTIONS.slice(0, 5).map((q) => (
            <button key={q} className="chip" onClick={() => send(q)}>{q}</button>
          ))}
        </div>
      )}

      <div className="composer">
        <input
          placeholder="Ask anything about investing"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send(input)}
        />
        <button onClick={() => send(input)} disabled={!input.trim() || typing} aria-label="Send">
          <ArrowUp size={19} strokeWidth={2.6} />
        </button>
      </div>
      <p className="tiny" style={{ textAlign: 'center', marginTop: 8 }}>Educational experience. Not financial advice.</p>
    </div>
  );
}
