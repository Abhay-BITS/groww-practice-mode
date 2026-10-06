import { useState } from 'react';
import { Brain, Clock, Compass, GraduationCap, Home as HomeIcon, MessageCircle, PieChart, RotateCcw, Signal, Wifi, Battery } from 'lucide-react';
import { StoreProvider, useSnapshot, useStore } from '@/state/store';
import { AppBar } from '@/components/ui';
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
  coach: 'Learning coach',
  graduate: 'Graduate to real',
};

const VALID_TABS: Tab[] = ['home', 'explore', 'portfolio', 'time', 'dna', 'coach', 'graduate'];

/** ?tab=dna lets a reviewer be linked straight to a feature instead of hunting for it. */
function initialTab(): Tab {
  if (typeof window === 'undefined') return 'home';
  const t = new URLSearchParams(window.location.search).get('tab') as Tab | null;
  return t && VALID_TABS.includes(t) ? t : 'home';
}

function Shell() {
  const { s, reset } = useStore();
  const snap = useSnapshot();
  const [tab, setTab] = useState<Tab>(initialTab);

  const go = (t: Tab) => {
    setTab(t);
    document.querySelector('.viewport')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isSub = tab === 'dna' || tab === 'graduate';

  return (
    <div className="phone">
      <div className="notch" />
      <div className="statusbar">
        <span>9:41</span>
        <span className="bars">
          <Signal size={13} strokeWidth={2.5} /><Wifi size={13} strokeWidth={2.5} /><Battery size={15} strokeWidth={2.5} />
        </span>
      </div>

      {!s.started ? (
        <div className="viewport" style={{ overflow: 'hidden' }}><Onboarding /></div>
      ) : (
        <>
          <AppBar
            title={TITLES[tab]}
            onBack={isSub ? () => go('home') : undefined}
            right={
              !isSub ? (
                <>
                  <button onClick={() => go('dna')} aria-label="Investor DNA"><Brain size={19} /></button>
                  <button onClick={() => go('graduate')} aria-label="Graduate"><GraduationCap size={19} /></button>
                </>
              ) : tab === 'dna' ? (
                <button onClick={() => { if (confirm('Reset your practice run?')) { reset(); go('home'); } }} aria-label="Reset"><RotateCcw size={17} /></button>
              ) : undefined
            }
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
  ['Every decision is asked "why"', 'Reason and horizon are captured at purchase, then replayed against what you actually did.'],
  ['Scored on judgement, not returns', 'Investor DNA rates spread, patience, composure and conviction. A lucky bet scores badly.'],
  ['The market falls while you hold', 'A scripted drawdown interrupts the run and records your reaction in real time.'],
  ['It ends in a real ₹100 SIP', 'Practice is a fourteen-day programme with an exit, not a sandbox to live in.'],
];

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
          <h1>Your first ten investing mistakes should cost you <b>nothing</b>.</h1>
          <p>
            A beginner-first practice account for 20&ndash;26 year olds getting their first paycheck.
            &#8377;1,00,000 in fake rupees, a market that falls when you are not ready, and a score that
            measures how you decide rather than what you earned.
          </p>
          <div className="pitch-points">
            {POINTS.map(([t, d], i) => (
              <div className="pitch-point" key={t}>
                <i>{i + 1}</i>
                <div>
                  <b>{t}</b>
                  <span>{d}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="pitch-foot">
            Concept prototype for the Groww Product Internship assignment. Not affiliated with Groww.
            All prices and portfolios are simulated, and nothing here is investment advice.
          </p>
        </div>
        <Shell />
      </div>
    </StoreProvider>
  );
}
