import { useState } from 'react';
import { Battery, Clock, Compass, Home as HomeIcon, MessageCircle, PieChart, Signal, Wifi } from 'lucide-react';
import { StoreProvider, useSnapshot, useStore } from '@/state/store';
import { AppBar, scoreColor } from '@/components/ui';
import { overall, traits } from '@/lib/dna';
import { Onboarding } from '@/screens/Onboarding';
import { Home } from '@/screens/Home';
import { Explore } from '@/screens/Explore';
import { Portfolio } from '@/screens/Portfolio';
import { TimeMachine, PanicModal } from '@/screens/TimeMachine';
import { DNA } from '@/screens/DNA';
import { Coach } from '@/screens/Coach';
import { Graduate } from '@/screens/Graduate';
import '@/styles/globals.css';

export type Tab = 'home' | 'explore' | 'portfolio' | 'time' | 'dna' | 'coach' | 'graduate';

const TABS: { id: Tab; label: string; icon: typeof HomeIcon }[] = [
  { id: 'home', label: 'Home', icon: HomeIcon },
  { id: 'explore', label: 'Explore', icon: Compass },
  { id: 'portfolio', label: 'Portfolio', icon: PieChart },
  { id: 'time', label: 'Time', icon: Clock },
  { id: 'coach', label: 'Coach', icon: MessageCircle },
];

const TITLES: Record<Tab, string> = {
  home: 'Practice Mode',
  explore: 'Explore',
  portfolio: 'Your portfolio',
  time: 'Time machine',
  dna: 'Investor DNA',
  coach: 'Coach',
  graduate: 'Invest for real',
};

const VALID: Tab[] = ['home', 'explore', 'portfolio', 'time', 'dna', 'coach', 'graduate'];

/** ?tab=dna links a reviewer straight to a feature instead of making them hunt for it. */
function initialTab(): Tab {
  const t = new URLSearchParams(window.location.search).get('tab') as Tab | null;
  return t && VALID.includes(t) ? t : 'home';
}

function Shell() {
  const { s } = useStore();
  const snap = useSnapshot();
  const [tab, setTab] = useState<Tab>(initialTab);
  const dna = overall(traits(s, snap));

  const go = (t: Tab) => {
    setTab(t);
    document.querySelector('.viewport')?.scrollTo({ top: 0 });
  };
  const isSub = tab === 'dna' || tab === 'graduate';

  return (
    <div className="phone">
      <div className="notch" />
      <div className="statusbar">
        <span>9:41</span>
        <span className="bars"><Signal size={13} strokeWidth={2.5} /><Wifi size={13} strokeWidth={2.5} /><Battery size={15} strokeWidth={2.5} /></span>
      </div>

      {!s.started ? (
        <div className="viewport" style={{ overflow: 'hidden' }}><Onboarding /></div>
      ) : (
        <>
          <AppBar
            title={TITLES[tab]}
            onBack={isSub ? () => go('home') : undefined}
            right={!isSub && s.trades.length > 0 ? (
              <button className="dna-chip" onClick={() => go('dna')} aria-label={`Investor DNA ${dna}`}>
                <i style={{ background: scoreColor(dna) }} />DNA {dna}
              </button>
            ) : undefined}
          />

          <div className="viewport" key={tab}>
            {tab === 'home' && <Home snap={snap} go={go} />}
            {tab === 'explore' && <Explore snap={snap} />}
            {tab === 'portfolio' && <Portfolio snap={snap} go={go} />}
            {tab === 'time' && <TimeMachine snap={snap} />}
            {tab === 'dna' && <DNA snap={snap} />}
            {tab === 'coach' && <Coach snap={snap} />}
            {tab === 'graduate' && <Graduate snap={snap} />}
          </div>

          <div className="tabbar">
            {TABS.map((t) => (
              <button key={t.id} className={tab === t.id ? 'on' : ''} onClick={() => go(t.id)}>
                <t.icon size={20} strokeWidth={tab === t.id ? 2.4 : 1.9} />
                {t.label}
              </button>
            ))}
          </div>

          <PanicModal />
        </>
      )}
    </div>
  );
}

const POINTS: [string, string][] = [
  ['Every buy asks why', 'And for how long. Later, the replay puts what you said next to what you did.'],
  ['The market falls while you hold', 'What you do, and how many seconds you take to decide, gets recorded.'],
  ['The score ignores profit', 'Investor DNA rates spread, patience, composure and conviction. A lucky bet scores badly.'],
  ['It ends in a real SIP', 'From ₹100 a month, built from the funds you practised with. Stocks are left out.'],
];

function restart(demo: boolean) {
  try { localStorage.clear(); } catch { /* private mode: nothing stored anyway */ }
  window.location.href = demo ? '/?demo' : '/';
}

export default function App() {
  return (
    <StoreProvider>
      <div className="stage">
        <div className="pitch">
          <div className="pitch-logo">
            <img src="/groww-logo.png" alt="" />
            <span>Groww</span>
            <em>Practice Mode</em>
          </div>
          <h1>A practice account that grades the <b>decision</b>, not the result.</h1>
          <p>
            For 20 to 26 year olds making their first investment. ₹1,00,000 of practice money, a year
            of market in about ten minutes, and a score that leaves profit out on purpose.
          </p>
          <div className="pitch-points">
            {POINTS.map(([t, d], i) => (
              <div className="pitch-point" key={t}>
                <span className="pitch-num">{i + 1}</span>
                <div><b>{t}</b><span>{d}</span></div>
              </div>
            ))}
          </div>
          <div className="pitch-actions">
            <button className="btn sm" onClick={() => restart(false)}>Start fresh</button>
            <button className="btn sm ghost" onClick={() => restart(true)}>Open a run in progress</button>
          </div>
          <p className="pitch-foot">
            Prototype for the Groww product internship assignment. Not affiliated with Groww. Prices are
            simulated and nothing here is investment advice.
          </p>
        </div>
        <Shell />
      </div>
    </StoreProvider>
  );
}
