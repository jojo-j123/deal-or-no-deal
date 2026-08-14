import { useMemo } from 'react';
import type { BankerConfig, BundleItem, GameConfig } from '../../engine/types.ts';
import { calculateOffer } from '../../engine/OfferCalculator.ts';
import { formatValue } from '../../engine/format.ts';
import { uid } from '../../engine/rng.ts';
import {
  FieldGrid,
  NumberField,
  SectionHeader,
  SelectField,
  SliderField,
  TextField,
} from './fields.tsx';

interface Props {
  config: GameConfig;
  update: (patch: Partial<GameConfig>) => void;
}

export function BankerSection({ config, update }: Props) {
  const banker = config.banker;
  const setBanker = (patch: Partial<BankerConfig>) => update({ banker: { ...banker, ...patch } });

  /**
   * Live simulation of the offer curve. Jitter is pinned to its midpoint so the
   * numbers only move when a setting moves.
   */
  const simulation = useMemo(() => {
    const values = config.prizes
      .map((p) => p.estimatedValue ?? 0)
      .sort((a, b) => a - b);
    if (values.length === 0) return [];

    const mid = values.filter((_, index) => index % 2 === 0);
    const late = [values[0], values[Math.floor(values.length / 2)], values[values.length - 1]];
    const finalTwo = [values[Math.floor(values.length / 2)], values[values.length - 1]];

    const states: { label: string; remaining: number[]; progress: number }[] = [
      { label: 'Opening rounds', remaining: values, progress: 0.15 },
      { label: 'Halfway', remaining: mid, progress: 0.5 },
      { label: 'Three left', remaining: late, progress: 0.85 },
      { label: 'Final two', remaining: finalTwo, progress: 1 },
    ];

    return states.map((state) => {
      const breakdown = calculateOffer({
        remainingValues: state.remaining,
        progress: state.progress,
        banker,
        random: () => 0.5,
      });
      return {
        label: state.label,
        cases: state.remaining.length,
        average: breakdown.average,
        offer: breakdown.final,
        ratio: breakdown.average > 0 ? breakdown.final / breakdown.average : 0,
      };
    });
  }, [config.prizes, banker]);

  const fmt = (value: number) => formatValue(value, config.valueFormat);

  return (
    <div className="creator-section">
      <SectionHeader
        title="Banker"
        description="The offer is built from the board, not from a random number. Tune the curve and watch it respond."
      />

      <FieldGrid>
        <TextField label="Banker name" value={banker.name} onChange={(name) => setBanker({ name })} />
        <SelectField
          label="Personality"
          value={banker.personality}
          options={[
            { value: 'fair', label: 'Fair — offers near the maths' },
            { value: 'ruthless', label: 'Ruthless — lowballs everything' },
            { value: 'generous', label: 'Generous — overpays to close' },
            { value: 'chaotic', label: 'Chaotic — wildly inconsistent' },
            { value: 'showman', label: 'Showman — cheap early, big late' },
          ]}
          onChange={(personality) => setBanker({ personality })}
        />
      </FieldGrid>

      <FieldGrid>
        <SliderField
          label="Aggressiveness"
          value={banker.aggressiveness}
          onChange={(aggressiveness) => setBanker({ aggressiveness })}
          hint="Pushes every offer down."
        />
        <SliderField
          label="Generosity"
          value={banker.generosity}
          onChange={(generosity) => setBanker({ generosity })}
          hint="Pushes every offer up."
        />
        <SliderField
          label="Risk appetite"
          value={banker.risk}
          onChange={(risk) => setBanker({ risk })}
          hint="Above 50 the Banker believes the big prizes are still out there."
        />
        <SliderField
          label="Variance penalty"
          value={banker.variancePenalty}
          onChange={(variancePenalty) => setBanker({ variancePenalty })}
          hint="How much a wide board discounts the offer."
        />
        <SliderField
          label="Jitter"
          value={banker.jitter}
          onChange={(jitter) => setBanker({ jitter })}
          hint="Random swing on each call."
        />
        <NumberField
          label="Countdown (seconds)"
          value={banker.countdownSeconds}
          min={0}
          max={120}
          onChange={(countdownSeconds) => setBanker({ countdownSeconds: countdownSeconds ?? 0 })}
          hint="0 removes the timer. Running out counts as No Deal."
        />
      </FieldGrid>

      <FieldGrid>
        <SelectField
          label="Rounding"
          value={banker.rounding}
          options={[
            { value: 'nice', label: 'Nice numbers' },
            { value: 'whole', label: 'Whole numbers' },
            { value: 'none', label: 'Exact' },
          ]}
          onChange={(rounding) => setBanker({ rounding })}
        />
        <SelectField
          label="Offer presentation"
          value={banker.offerPresentation}
          options={[
            { value: 'value', label: 'A number' },
            { value: 'bundle', label: 'A bundle of items' },
          ]}
          onChange={(offerPresentation) => setBanker({ offerPresentation })}
          hint="Bundles let a non-money game stay non-money at the decision screen."
        />
      </FieldGrid>

      <h3 className="creator-subhead">Offer simulation</h3>
      <table className="sim-table">
        <thead>
          <tr>
            <th scope="col">Board state</th>
            <th scope="col">Cases</th>
            <th scope="col">Average</th>
            <th scope="col">Offer</th>
            <th scope="col">% of average</th>
          </tr>
        </thead>
        <tbody>
          {simulation.map((row) => (
            <tr key={row.label}>
              <th scope="row">{row.label}</th>
              <td>{row.cases}</td>
              <td>{fmt(row.average)}</td>
              <td className="sim-table__offer">{fmt(row.offer)}</td>
              <td>
                <span className="sim-bar" style={{ '--pct': `${Math.min(120, row.ratio * 100)}%` } as React.CSSProperties}>
                  {Math.round(row.ratio * 100)}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {banker.offerPresentation === 'bundle' ? (
        <BundleEditor
          items={banker.bundleCatalog}
          onChange={(bundleCatalog) => setBanker({ bundleCatalog })}
          format={(value) => fmt(value)}
        />
      ) : null}
    </div>
  );
}

function BundleEditor({
  items,
  onChange,
  format,
}: {
  items: BundleItem[];
  onChange: (items: BundleItem[]) => void;
  format: (value: number) => string;
}) {
  const patch = (index: number, next: Partial<BundleItem>) =>
    onChange(items.map((item, i) => (i === index ? { ...item, ...next } : item)));

  return (
    <>
      <h3 className="creator-subhead">Banker&rsquo;s catalogue</h3>
      <p className="field__hint creator-note">
        When the Banker offers a bundle, the largest affordable items are picked from this list until
        the offer value is spent.
      </p>
      <div className="bundle-list">
        {items.map((item, index) => (
          <div className="bundle-item" key={item.id}>
            <input
              className="input bundle-item__icon"
              value={item.icon ?? ''}
              aria-label={`Icon for catalogue item ${index + 1}`}
              onChange={(event) => patch(index, { icon: event.target.value })}
            />
            <input
              className="input"
              value={item.displayName}
              aria-label={`Name for catalogue item ${index + 1}`}
              onChange={(event) => patch(index, { displayName: event.target.value })}
            />
            <input
              className="input"
              type="number"
              value={item.value}
              aria-label={`Value for catalogue item ${index + 1}`}
              onChange={(event) => patch(index, { value: Number(event.target.value) || 0 })}
            />
            <span className="bundle-item__preview text-muted">{format(item.value)}</span>
            <button
              type="button"
              className="icon-btn icon-btn--sm icon-btn--danger"
              aria-label={`Remove catalogue item ${index + 1}`}
              onClick={() => onChange(items.filter((_, i) => i !== index))}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="btn btn--sm btn--ghost"
        onClick={() =>
          onChange([...items, { id: uid('bundle'), displayName: 'New item', value: 500, icon: '🎁' }])
        }
      >
        Add catalogue item
      </button>
    </>
  );
}
