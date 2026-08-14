import { useState } from 'react';
import type { GameConfig, Prize, PrizeRarity } from '../../engine/types.ts';
import { createPrize } from '../../engine/ConfigManager.ts';
import { formatValue } from '../../engine/format.ts';
import { generateMoneyLadder, moveItem, resizePrizes, sortPrizesByValue } from './helpers.ts';
import { SectionHeader } from './fields.tsx';

interface Props {
  config: GameConfig;
  update: (patch: Partial<GameConfig>) => void;
}

const RARITIES: PrizeRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

export function PrizesSection({ config, update }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const prizes = config.prizes;
  const balance = prizes.length - config.caseCount;

  const setPrizes = (next: Prize[]) => update({ prizes: next });

  const patchPrize = (index: number, patch: Partial<Prize>) => {
    setPrizes(prizes.map((prize, i) => (i === index ? { ...prize, ...patch } : prize)));
  };

  return (
    <div className="creator-section">
      <SectionHeader
        title="Prizes"
        description="One prize per case. A prize can be an amount, an object, a character — anything with a name. The estimated value is only ever used by the Banker's arithmetic."
      />

      <div className="prize-toolbar">
        <span className={`chip ${balance === 0 ? 'chip--accent' : 'chip--danger'}`}>
          {prizes.length} / {config.caseCount} prizes
        </span>
        <div className="prize-toolbar__actions">
          <button
            type="button"
            className="btn btn--sm btn--ghost"
            onClick={() => setPrizes([...prizes, createPrize({ name: `Prize ${prizes.length + 1}`, icon: '🎁' })])}
          >
            Add prize
          </button>
          <button type="button" className="btn btn--sm btn--ghost" onClick={() => setPrizes(sortPrizesByValue(prizes))}>
            Sort by value
          </button>
          <button
            type="button"
            className="btn btn--sm btn--ghost"
            onClick={() => setPrizes(resizePrizes(prizes, config.caseCount))}
            disabled={balance === 0}
          >
            Fit to {config.caseCount}
          </button>
          <button
            type="button"
            className="btn btn--sm btn--ghost"
            onClick={() => setPrizes(generateMoneyLadder(config.caseCount))}
          >
            Money ladder
          </button>
        </div>
      </div>

      <div className="prize-list" role="list">
        <div className="prize-list__head" aria-hidden="true">
          <span>Icon</span>
          <span>Display name</span>
          <span>Estimated value</span>
          <span>Rarity</span>
          <span />
        </div>

        {prizes.map((prize, index) => {
          const isOpen = expanded === prize.id;
          return (
            <div className="prize-item" key={prize.id} role="listitem" data-open={isOpen}>
              <div className="prize-item__row">
                <input
                  className="input prize-item__icon"
                  value={prize.icon ?? ''}
                  aria-label={`Icon for prize ${index + 1}`}
                  placeholder="🎁"
                  onChange={(event) => patchPrize(index, { icon: event.target.value })}
                />
                <input
                  className="input"
                  value={prize.displayName}
                  aria-label={`Display name for prize ${index + 1}`}
                  placeholder={formatValue(prize.estimatedValue, config.valueFormat) || 'Prize name'}
                  onChange={(event) =>
                    patchPrize(index, { displayName: event.target.value, name: event.target.value || prize.name })
                  }
                />
                <input
                  className="input"
                  type="number"
                  value={prize.estimatedValue ?? ''}
                  aria-label={`Estimated value for prize ${index + 1}`}
                  onChange={(event) =>
                    patchPrize(index, {
                      estimatedValue: event.target.value === '' ? undefined : Number(event.target.value),
                    })
                  }
                />
                <select
                  className="select"
                  value={prize.rarity ?? 'common'}
                  aria-label={`Rarity for prize ${index + 1}`}
                  onChange={(event) => patchPrize(index, { rarity: event.target.value as PrizeRarity })}
                >
                  {RARITIES.map((rarity) => (
                    <option key={rarity} value={rarity}>
                      {rarity}
                    </option>
                  ))}
                </select>
                <div className="prize-item__buttons">
                  <button
                    type="button"
                    className="icon-btn icon-btn--sm"
                    aria-label={`Move prize ${index + 1} up`}
                    disabled={index === 0}
                    onClick={() => setPrizes(moveItem(prizes, index, index - 1))}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="icon-btn icon-btn--sm"
                    aria-label={`Move prize ${index + 1} down`}
                    disabled={index === prizes.length - 1}
                    onClick={() => setPrizes(moveItem(prizes, index, index + 1))}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="icon-btn icon-btn--sm"
                    aria-label={`More options for prize ${index + 1}`}
                    aria-expanded={isOpen}
                    onClick={() => setExpanded(isOpen ? null : prize.id)}
                  >
                    ⋯
                  </button>
                  <button
                    type="button"
                    className="icon-btn icon-btn--sm icon-btn--danger"
                    aria-label={`Delete prize ${index + 1}`}
                    onClick={() => setPrizes(prizes.filter((_, i) => i !== index))}
                  >
                    ✕
                  </button>
                </div>
              </div>

              {isOpen ? (
                <div className="prize-item__detail">
                  <label className="field">
                    <span className="field__label">Internal name</span>
                    <input
                      className="input"
                      value={prize.name}
                      onChange={(event) => patchPrize(index, { name: event.target.value })}
                    />
                  </label>
                  <label className="field">
                    <span className="field__label">Image URL</span>
                    <input
                      className="input"
                      value={prize.image ?? ''}
                      placeholder="https://… or data:image/…"
                      onChange={(event) => patchPrize(index, { image: event.target.value || undefined })}
                    />
                  </label>
                  <label className="field prize-item__detail-wide">
                    <span className="field__label">Description</span>
                    <input
                      className="input"
                      value={prize.description ?? ''}
                      onChange={(event) => patchPrize(index, { description: event.target.value || undefined })}
                    />
                  </label>
                  <p className="field__hint prize-item__detail-wide">
                    Leave the display name empty to show the formatted value instead — that is how the
                    money board works without hardcoding a currency.
                  </p>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
