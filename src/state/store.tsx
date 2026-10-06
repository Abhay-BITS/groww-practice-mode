import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getMarketPath, priceOn, TRADING_DAYS, type RegimeId } from '@/lib/market';
import { snapshot } from '@/lib/dna';
import { demoState } from '@/state/demo';
import { STARTING_CASH, type GameState, type HorizonId, type PanicChoice, type Profile, type ReasonId, type Trade } from '@/lib/types';

const KEY = 'groww.practice.v2';

const initial: GameState = {
  started: false,
  profile: null,
  regime: 'crash2020',
  day: 0,
  cash: STARTING_CASH,
  lots: [],
  trades: [],
  panics: [],
  pendingPanic: null,
  sessionsCompleted: 0,
  graduated: false,
  seenGlossary: [],
  paycheckClaimed: false,
};

function load(): GameState {
  // ?demo drops a reviewer straight into a run in progress. It is explicit and
  // opt-in, so a real first-time user still starts from an empty account.
  if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('demo')) {
    return demoState();
  }
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initial;
    return { ...initial, ...(JSON.parse(raw) as GameState), pendingPanic: null };
  } catch {
    return initial;
  }
}

type Store = {
  s: GameState;
  set: (patch: Partial<GameState> | ((prev: GameState) => Partial<GameState>)) => void;
  start: (profile: Profile) => void;
  buy: (instrumentId: string, amount: number, reasonId: ReasonId, horizonId: HorizonId) => void;
  sell: (instrumentId: string, units: number, exitReason: Trade['exitReason']) => void;
  advance: (days: number) => void;
  answerPanic: (choice: PanicChoice) => void;
  reset: () => void;
  setRegime: (id: RegimeId) => void;
  markGlossary: (term: string) => void;
};

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [s, setState] = useState<GameState>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch {
      /* Private browsing. The session still works, it just will not survive a reload. */
    }
  }, [s]);

  const set: Store['set'] = useCallback((patch) => {
    setState((prev) => ({ ...prev, ...(typeof patch === 'function' ? patch(prev) : patch) }));
  }, []);

  const start = useCallback((profile: Profile) => {
    set({ started: true, profile });
  }, [set]);

  const buy: Store['buy'] = useCallback((instrumentId, amount, reasonId, horizonId) => {
    setState((prev) => {
      if (amount <= 0 || amount > prev.cash) return prev;
      const price = priceOn(prev.regime, instrumentId, prev.day);
      const units = amount / price;
      const existing = prev.lots.find((l) => l.instrumentId === instrumentId);
      const lots = existing
        ? prev.lots.map((l) =>
            l.instrumentId === instrumentId
              ? { ...l, cost: (l.cost * l.units + amount) / (l.units + units), units: l.units + units }
              : l,
          )
        : [...prev.lots, { instrumentId, units, cost: price, horizonId, reasonId, openedDay: prev.day }];
      const trade: Trade = {
        id: `${Date.now()}-${instrumentId}`,
        instrumentId, kind: 'buy', amount, units, price, day: prev.day, reasonId, horizonId,
      };
      return { ...prev, cash: prev.cash - amount, lots, trades: [...prev.trades, trade] };
    });
  }, []);

  const sell: Store['sell'] = useCallback((instrumentId, units, exitReason) => {
    setState((prev) => {
      const lot = prev.lots.find((l) => l.instrumentId === instrumentId);
      if (!lot) return prev;
      const qty = Math.min(units, lot.units);
      const price = priceOn(prev.regime, instrumentId, prev.day);
      const amount = qty * price;
      const lots = lot.units - qty < 1e-6
        ? prev.lots.filter((l) => l.instrumentId !== instrumentId)
        : prev.lots.map((l) => (l.instrumentId === instrumentId ? { ...l, units: l.units - qty } : l));
      const trade: Trade = {
        id: `${Date.now()}-${instrumentId}-s`,
        instrumentId, kind: 'sell', amount, units: qty, price, day: prev.day,
        reasonId: lot.reasonId, horizonId: lot.horizonId, exitReason,
      };
      return { ...prev, cash: prev.cash + amount, lots, trades: [...prev.trades, trade] };
    });
  }, []);

  /**
   * Fast-forward. We stop early the first time we cross the scripted panic day
   * so the alert interrupts the run rather than arriving after it, which is the
   * only way the reaction we record means anything.
   */
  const advance: Store['advance'] = useCallback((days) => {
    setState((prev) => {
      if (prev.pendingPanic) return prev;
      const path = getMarketPath(prev.regime);
      const target = Math.min(prev.day + days, TRADING_DAYS);
      const alreadyAnswered = prev.panics.some((p) => p.day === path.panicDay);
      const invested = prev.lots.length > 0;

      if (path.panicDay !== null && invested && !alreadyAnswered && prev.day < path.panicDay && target >= path.panicDay) {
        let peak = path.index[0];
        for (let d = 0; d <= path.panicDay; d++) peak = Math.max(peak, path.index[d]);
        const drawdown = (path.index[path.panicDay] / peak - 1) * 100;
        return {
          ...prev,
          day: path.panicDay,
          pendingPanic: { day: path.panicDay, drawdown, shownAt: Date.now() },
        };
      }
      return { ...prev, day: target };
    });
  }, []);

  const answerPanic: Store['answerPanic'] = useCallback((choice) => {
    setState((prev) => {
      if (!prev.pendingPanic) return prev;
      const { day, drawdown, shownAt } = prev.pendingPanic;
      let next: GameState = {
        ...prev,
        pendingPanic: null,
        panics: [...prev.panics, { day, drawdown, choice, deliberationMs: Date.now() - shownAt }],
      };
      if (choice === 'sell') {
        // Liquidate everything at the bottom, exactly as asked.
        const proceeds = next.lots.reduce((t, l) => t + l.units * priceOn(next.regime, l.instrumentId, day), 0);
        const exits: Trade[] = next.lots.map((l) => ({
          id: `${Date.now()}-${l.instrumentId}-panic`,
          instrumentId: l.instrumentId, kind: 'sell' as const,
          amount: l.units * priceOn(next.regime, l.instrumentId, day),
          units: l.units, price: priceOn(next.regime, l.instrumentId, day),
          day, reasonId: l.reasonId, horizonId: l.horizonId, exitReason: 'scared' as const,
        }));
        next = { ...next, cash: next.cash + proceeds, lots: [], trades: [...next.trades, ...exits] };
      }
      if (choice === 'buy') {
        // Put a tenth of remaining cash to work, spread across what is held.
        const spend = Math.min(next.cash * 0.1, next.cash);
        if (spend > 100 && next.lots.length) {
          const each = spend / next.lots.length;
          const lots = next.lots.map((l) => {
            const price = priceOn(next.regime, l.instrumentId, day);
            const units = each / price;
            return { ...l, cost: (l.cost * l.units + each) / (l.units + units), units: l.units + units };
          });
          const buys: Trade[] = next.lots.map((l) => ({
            id: `${Date.now()}-${l.instrumentId}-add`,
            instrumentId: l.instrumentId, kind: 'buy' as const, amount: each,
            units: each / priceOn(next.regime, l.instrumentId, day),
            price: priceOn(next.regime, l.instrumentId, day),
            day, reasonId: 'dip' as const, horizonId: l.horizonId,
          }));
          next = { ...next, cash: next.cash - spend, lots, trades: [...next.trades, ...buys] };
        }
      }
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setState((prev) => ({ ...initial, started: true, profile: prev.profile, regime: prev.regime }));
  }, []);

  const setRegime = useCallback((id: RegimeId) => {
    setState((prev) => ({ ...prev, regime: id, day: 0, cash: STARTING_CASH, lots: [], trades: [], panics: [], pendingPanic: null }));
  }, []);

  const markGlossary = useCallback((term: string) => {
    setState((prev) => (prev.seenGlossary.includes(term) ? prev : { ...prev, seenGlossary: [...prev.seenGlossary, term] }));
  }, []);

  const value = useMemo(
    () => ({ s, set, start, buy, sell, advance, answerPanic, reset, setRegime, markGlossary }),
    [s, set, start, buy, sell, advance, answerPanic, reset, setRegime, markGlossary],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useStore outside StoreProvider');
  return ctx;
}

export function useSnapshot() {
  const { s } = useStore();
  return useMemo(() => snapshot(s), [s]);
}
