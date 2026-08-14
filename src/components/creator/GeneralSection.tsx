import type { GameConfig, ValueFormat } from '../../engine/types.ts';
import { CASE_COUNT_OPTIONS, MAX_CASES, MIN_CASES, clampCaseCount } from '../../engine/ConfigManager.ts';
import { formatValue } from '../../engine/format.ts';
import { applyCaseCount } from './helpers.ts';
import {
  FieldGrid,
  NumberField,
  SectionHeader,
  SelectField,
  SliderField,
  SwitchField,
  TextArea,
  TextField,
} from './fields.tsx';

interface Props {
  config: GameConfig;
  update: (patch: Partial<GameConfig>) => void;
  replace: (config: GameConfig) => void;
}

export function GeneralSection({ config, update, replace }: Props) {
  const setFormat = (patch: Partial<ValueFormat>) =>
    update({ valueFormat: { ...config.valueFormat, ...patch } });

  const sample = formatValue(48000, config.valueFormat);

  return (
    <div className="creator-section">
      <SectionHeader
        title="General"
        description="What the game is called, how many cases it uses, and how numbers are written."
      />

      <FieldGrid>
        <TextField
          label="Game title"
          value={config.gameTitle}
          onChange={(gameTitle) => update({ gameTitle })}
        />
        <SelectField
          label="Mode"
          value={config.mode}
          options={[
            { value: 'money', label: 'Classic money' },
            { value: 'custom', label: 'Custom prizes' },
          ]}
          onChange={(mode) => update({ mode })}
          hint="Only a label — the engine treats both identically."
        />
      </FieldGrid>

      <TextArea
        label="Description"
        value={config.description}
        onChange={(description) => update({ description })}
        rows={2}
      />

      <FieldGrid>
        <SelectField
          label="Case count"
          value={String(CASE_COUNT_OPTIONS.includes(config.caseCount) ? config.caseCount : 'custom')}
          options={[
            ...CASE_COUNT_OPTIONS.map((count) => ({ value: String(count), label: `${count} cases` })),
            { value: 'custom', label: 'Custom…' },
          ]}
          onChange={(value) => {
            if (value === 'custom') return;
            replace(applyCaseCount(config, Number(value)));
          }}
          hint="Prizes and rounds are re-fitted automatically."
        />
        <NumberField
          label="Exact case count"
          value={config.caseCount}
          min={MIN_CASES}
          max={MAX_CASES}
          onChange={(value) => replace(applyCaseCount(config, clampCaseCount(value ?? config.caseCount)))}
        />
      </FieldGrid>

      <h3 className="creator-subhead">Value format</h3>
      <p className="field__hint creator-note">
        Sample: <strong>{sample || '(values hidden)'}</strong>
      </p>
      <FieldGrid columns={3}>
        <SelectField
          label="Style"
          value={config.valueFormat.style}
          options={[
            { value: 'currency', label: 'Currency' },
            { value: 'number', label: 'Plain number' },
            { value: 'compact', label: 'Compact (1.2M)' },
            { value: 'none', label: 'Hide values' },
          ]}
          onChange={(style) => setFormat({ style })}
        />
        <TextField
          label="Currency code"
          value={config.valueFormat.currency}
          onChange={(currency) => setFormat({ currency: currency.toUpperCase() })}
          hint="USD, EUR, GBP, JPY…"
        />
        <TextField
          label="Locale"
          value={config.valueFormat.locale}
          onChange={(locale) => setFormat({ locale })}
          hint="en-US, de-DE, ja-JP…"
        />
        <TextField
          label="Prefix"
          value={config.valueFormat.prefix}
          onChange={(prefix) => setFormat({ prefix })}
        />
        <TextField
          label="Suffix"
          value={config.valueFormat.suffix}
          onChange={(suffix) => setFormat({ suffix })}
          hint="e.g. “ gold”, “ pts”"
        />
        <NumberField
          label="Max decimals"
          value={config.valueFormat.maximumFractionDigits}
          min={0}
          max={4}
          onChange={(maximumFractionDigits) =>
            setFormat({ maximumFractionDigits: maximumFractionDigits ?? 0 })
          }
        />
      </FieldGrid>

      <h3 className="creator-subhead">Rules</h3>
      <FieldGrid>
        <SwitchField
          label="Offer a swap on the final two"
          checked={config.rules.allowSwapAtEnd}
          onChange={(allowSwapAtEnd) => update({ rules: { ...config.rules, allowSwapAtEnd } })}
        />
        <SwitchField
          label="Show values on the prize board"
          checked={config.rules.showValuesOnBoard}
          onChange={(showValuesOnBoard) => update({ rules: { ...config.rules, showValuesOnBoard } })}
          hint="Useful when prizes are items rather than amounts."
        />
        <SwitchField
          label="Reveal the player's case after a deal"
          checked={config.rules.revealPlayerCaseAfterDeal}
          onChange={(revealPlayerCaseAfterDeal) =>
            update({ rules: { ...config.rules, revealPlayerCaseAfterDeal } })
          }
        />
        <SliderField
          label="Big prize threshold"
          value={Math.round(config.rules.bigPrizePercentile * 100)}
          min={30}
          max={95}
          suffix="%"
          onChange={(value) => update({ rules: { ...config.rules, bigPrizePercentile: value / 100 } })}
          hint="Prizes above this percentile trigger the celebratory reveal."
        />
      </FieldGrid>
    </div>
  );
}
