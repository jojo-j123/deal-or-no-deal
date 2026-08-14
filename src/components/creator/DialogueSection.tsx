import type { DialogueConfig, GameConfig } from '../../engine/types.ts';
import { ListField, SectionHeader, TextField } from './fields.tsx';

interface Props {
  config: GameConfig;
  update: (patch: Partial<GameConfig>) => void;
}

export function DialogueSection({ config, update }: Props) {
  const dialogue = config.dialogue;
  const set = (patch: Partial<DialogueConfig>) => update({ dialogue: { ...dialogue, ...patch } });

  return (
    <div className="creator-section">
      <SectionHeader
        title="Dialogue"
        description="Every line the game says. Lists are pools — one line is picked at random each time, so a long game never repeats itself."
      />

      <p className="field__hint creator-note">
        Placeholders: <code>{'{banker}'}</code> <code>{'{round}'}</code> <code>{'{count}'}</code>{' '}
        <code>{'{remaining}'}</code> <code>{'{prize}'}</code> <code>{'{offer}'}</code>{' '}
        <code>{'{caseA}'}</code> <code>{'{caseB}'}</code>
      </p>

      <TextField
        label="Choose your case"
        value={dialogue.pickOwnCase}
        onChange={(pickOwnCase) => set({ pickOwnCase })}
      />
      <ListField
        label="Round start"
        values={dialogue.roundStart}
        onChange={(roundStart) => set({ roundStart })}
        hint="One line per entry."
      />
      <ListField
        label="Between cases"
        values={dialogue.caseOpen}
        onChange={(caseOpen) => set({ caseOpen })}
      />
      <ListField
        label="High-value reveal"
        values={dialogue.revealHigh}
        onChange={(revealHigh) => set({ revealHigh })}
      />
      <ListField
        label="Low-value reveal"
        values={dialogue.revealLow}
        onChange={(revealLow) => set({ revealLow })}
      />
      <ListField
        label="Banker calling"
        values={dialogue.bankerCalling}
        onChange={(bankerCalling) => set({ bankerCalling })}
      />
      <ListField label="Offer" values={dialogue.offer} onChange={(offer) => set({ offer })} />
      <ListField label="Deal accepted" values={dialogue.deal} onChange={(deal) => set({ deal })} />
      <ListField label="No deal" values={dialogue.noDeal} onChange={(noDeal) => set({ noDeal })} />
      <TextField
        label="Final two"
        value={dialogue.finalTwo}
        onChange={(finalTwo) => set({ finalTwo })}
      />
      <ListField label="Victory" values={dialogue.victory} onChange={(victory) => set({ victory })} />
      <ListField label="Loss" values={dialogue.loss} onChange={(loss) => set({ loss })} />
    </div>
  );
}
