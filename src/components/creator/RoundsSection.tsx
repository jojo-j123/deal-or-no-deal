import type { GameConfig, RoundPlan } from '../../engine/types.ts';
import { RoundManager } from '../../engine/RoundManager.ts';
import { uid } from '../../engine/rng.ts';
import { moveItem } from './helpers.ts';
import { SectionHeader } from './fields.tsx';

interface Props {
  config: GameConfig;
  update: (patch: Partial<GameConfig>) => void;
}

export function RoundsSection({ config, update }: Props) {
  const validation = RoundManager.validate(config.rounds, config.caseCount);
  const setRounds = (rounds: RoundPlan[]) => update({ rounds });

  const patchRound = (index: number, patch: Partial<RoundPlan>) =>
    setRounds(config.rounds.map((round, i) => (i === index ? { ...round, ...patch } : round)));

  return (
    <div className="creator-section">
      <SectionHeader
        title="Rounds"
        description="How many cases the player opens before the Banker calls. The rounds must open every case except the player's own and the last one standing."
      />

      <div className="round-summary" data-valid={validation.valid}>
        <div>
          <span className="eyebrow">Cases opened by rounds</span>
          <strong>
            {validation.totalToOpen} / {validation.required}
          </strong>
        </div>
        <div className="round-summary__actions">
          <button
            type="button"
            className="btn btn--sm btn--primary"
            onClick={() => setRounds(RoundManager.generate(config.caseCount))}
          >
            Auto-generate
          </button>
          <button
            type="button"
            className="btn btn--sm btn--ghost"
            onClick={() =>
              setRounds([...config.rounds, { id: uid('round'), casesToOpen: 1, offerAfter: true }])
            }
          >
            Add round
          </button>
        </div>
      </div>

      {validation.issues.length > 0 ? (
        <ul className="issue-list">
          {validation.issues.map((issue, index) => (
            <li key={index} className="issue" data-level={issue.level}>
              {issue.message}
            </li>
          ))}
        </ul>
      ) : (
        <p className="issue" data-level="ok">
          The schedule fits {config.caseCount} cases exactly.
        </p>
      )}

      <ol className="round-list">
        {config.rounds.map((round, index) => (
          <li className="round-item" key={round.id}>
            <span className="round-item__index display">{index + 1}</span>

            <label className="field round-item__count">
              <span className="field__label">Cases to open</span>
              <input
                className="input"
                type="number"
                min={1}
                max={config.caseCount - 2}
                value={round.casesToOpen}
                onChange={(event) =>
                  patchRound(index, { casesToOpen: Math.max(1, Number(event.target.value) || 1) })
                }
              />
            </label>

            <label className="switch round-item__offer">
              <input
                type="checkbox"
                checked={round.offerAfter}
                onChange={(event) => patchRound(index, { offerAfter: event.target.checked })}
              />
              <span className="switch__track" />
              <span>Banker calls after</span>
            </label>

            <div className="round-item__buttons">
              <button
                type="button"
                className="icon-btn icon-btn--sm"
                aria-label={`Move round ${index + 1} up`}
                disabled={index === 0}
                onClick={() => setRounds(moveItem(config.rounds, index, index - 1))}
              >
                ↑
              </button>
              <button
                type="button"
                className="icon-btn icon-btn--sm"
                aria-label={`Move round ${index + 1} down`}
                disabled={index === config.rounds.length - 1}
                onClick={() => setRounds(moveItem(config.rounds, index, index + 1))}
              >
                ↓
              </button>
              <button
                type="button"
                className="icon-btn icon-btn--sm icon-btn--danger"
                aria-label={`Delete round ${index + 1}`}
                onClick={() => setRounds(config.rounds.filter((_, i) => i !== index))}
              >
                ✕
              </button>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
