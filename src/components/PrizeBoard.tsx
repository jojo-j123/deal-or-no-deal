import type { Prize } from '../engine/types.ts';

interface PrizeBoardProps {
  prizes: Prize[];
  remainingIds: string[];
  showValues: boolean;
  labelFor: (prize: Prize) => string;
  valueFor: (prize: Prize) => string;
  /** Prize that just left the board, for a one-off strike animation. */
  justEliminatedId?: string | null;
  title?: string;
  subtitle?: string;
}

/**
 * Every prize in the game, cheapest first, split into two columns.
 * Live prizes glow; eliminated ones are struck through and dimmed.
 */
export function PrizeBoard({
  prizes,
  remainingIds,
  showValues,
  labelFor,
  valueFor,
  justEliminatedId = null,
  title = 'Prize Board',
  subtitle,
}: PrizeBoardProps) {
  const remaining = new Set(remainingIds);
  const half = Math.ceil(prizes.length / 2);
  const columns = [prizes.slice(0, half), prizes.slice(half)];

  return (
    <section className="board panel" aria-label={`${title}: ${remaining.size} of ${prizes.length} prizes still in play`}>
      <header className="board__head">
        <h2 className="eyebrow">{title}</h2>
        <span className="board__count">
          <strong>{remaining.size}</strong>
          <span aria-hidden="true">/{prizes.length}</span>
        </span>
      </header>
      {subtitle ? <p className="board__subtitle">{subtitle}</p> : null}

      <div className="board__cols">
        {columns.map((column, columnIndex) => (
          <ul className="board__col" key={columnIndex}>
            {column.map((prize) => {
              const live = remaining.has(prize.id);
              return (
                <li
                  key={prize.id}
                  className="prize-row"
                  data-state={live ? 'live' : 'out'}
                  data-rarity={prize.rarity ?? 'common'}
                  data-just-out={justEliminatedId === prize.id ? 'true' : 'false'}
                >
                  <span className="prize-row__marker" aria-hidden="true">
                    {prize.icon ?? ''}
                  </span>
                  <span className="prize-row__name">{labelFor(prize)}</span>
                  {showValues ? (
                    <span className="prize-row__value">{valueFor(prize)}</span>
                  ) : null}
                  <span className="prize-row__strike" aria-hidden="true" />
                  <span className="sr-only">{live ? 'still in play' : 'eliminated'}</span>
                </li>
              );
            })}
          </ul>
        ))}
      </div>
    </section>
  );
}
