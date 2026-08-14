import { useCallback, useEffect, useRef } from 'react';
import type { CaseState, GamePhase, Prize } from '../engine/types.ts';
import { CaseArt } from './CaseArt.tsx';
import type { CaseVisualState } from './CaseArt.tsx';

/** Column counts that keep the grid balanced at the common case counts. */
const PREFERRED_COLUMNS: Record<number, number> = {
  8: 4, 10: 5, 12: 4, 16: 4, 20: 5, 24: 6, 26: 6, 30: 6, 32: 8, 50: 10,
};

function columnsFor(count: number): number {
  return PREFERRED_COLUMNS[count] ?? Math.min(8, Math.max(4, Math.round(Math.sqrt(count * 1.2))));
}

interface CaseGridProps {
  cases: CaseState[];
  phase: GamePhase;
  finalCandidateId: number | null;
  prizeFor: (prizeId: string) => Prize | undefined;
  labelFor: (prizeId: string) => string;
  onSelect: (caseId: number) => void;
  onHover: () => void;
  /** Case currently being revealed on stage — hidden from the grid. */
  activeCaseId?: number | null;
}

export function CaseGrid({
  cases,
  phase,
  finalCandidateId,
  prizeFor,
  labelFor,
  onSelect,
  onHover,
  activeCaseId = null,
}: CaseGridProps) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const columns = columnsFor(cases.length);
  const interactive = phase === 'pick-own' || phase === 'opening';

  const isSelectable = useCallback(
    (item: CaseState) => {
      if (phase === 'pick-own') return !item.opened;
      if (phase === 'opening') return !item.opened && !item.isPlayerCase;
      return false;
    },
    [phase],
  );

  /* Roving focus: one tab stop for the whole grid, arrows move between cases. */
  const moveFocus = useCallback(
    (from: number, delta: number) => {
      const total = cases.length;
      for (let step = 1; step <= total; step++) {
        const index = (from + delta * step + total * total) % total;
        const button = buttons.current[index];
        if (button && !button.disabled) {
          button.focus();
          return;
        }
      }
    },
    [cases.length],
  );

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const keys: Record<string, number> = {
      ArrowRight: 1,
      ArrowLeft: -1,
      ArrowDown: columns,
      ArrowUp: -columns,
    };
    if (event.key in keys) {
      event.preventDefault();
      moveFocus(index, keys[event.key]);
      return;
    }
    if (event.key === 'Home') {
      event.preventDefault();
      moveFocus(-1, 1);
    }
    if (event.key === 'End') {
      event.preventDefault();
      moveFocus(cases.length, -1);
    }
  };

  useEffect(() => {
    buttons.current = buttons.current.slice(0, cases.length);
  }, [cases.length]);

  return (
    <div
      className="case-grid"
      style={{
        '--cols': columns,
        '--cols-sm': Math.min(columns, 5),
        '--cols-xs': Math.min(columns, 4),
      } as React.CSSProperties}
      role="group"
      aria-label={
        phase === 'pick-own' ? 'Choose the case you keep' : 'Cases still in play'
      }
    >
      {cases.map((item, index) => {
        const selectable = isSelectable(item);
        const prize = prizeFor(item.prizeId);
        const visual: CaseVisualState = item.opened
          ? 'opened'
          : item.isPlayerCase
            ? 'player'
            : finalCandidateId === item.id
              ? 'candidate'
              : 'idle';

        const label = item.opened
          ? `Case ${item.number}, opened, contained ${labelFor(item.prizeId)}`
          : item.isPlayerCase
            ? `Case ${item.number}, the case you kept`
            : phase === 'pick-own'
              ? `Keep case ${item.number}`
              : `Open case ${item.number}`;

        return (
          <button
            key={item.id}
            type="button"
            ref={(el) => {
              buttons.current[index] = el;
            }}
            className="case-slot"
            data-hidden={activeCaseId === item.id ? 'true' : 'false'}
            data-opened={item.opened ? 'true' : 'false'}
            disabled={!selectable}
            aria-label={label}
            tabIndex={selectable && interactive ? 0 : -1}
            onClick={() => selectable && onSelect(item.id)}
            onMouseEnter={() => selectable && onHover()}
            onKeyDown={(event) => handleKeyDown(event, index)}
            style={{ '--stagger': `${Math.min(index * 22, 700)}ms` } as React.CSSProperties}
          >
            <CaseArt number={item.number} state={visual} />
            {item.opened && prize ? (
              <span className="case-slot__prize">
                {prize.icon ? <span className="case-slot__icon">{prize.icon}</span> : null}
                <span className="case-slot__label">{labelFor(item.prizeId)}</span>
              </span>
            ) : null}
            {item.isPlayerCase && !item.opened ? (
              <span className="case-slot__tag">Yours</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
