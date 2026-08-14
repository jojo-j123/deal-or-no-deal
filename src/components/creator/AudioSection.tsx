import type { AudioConfig, GameConfig, SoundName } from '../../engine/types.ts';
import { useSettings } from '../../react/settings.tsx';
import { FieldGrid, SectionHeader, SliderField, SwitchField, TextField } from './fields.tsx';

interface Props {
  config: GameConfig;
  update: (patch: Partial<GameConfig>) => void;
}

const CUES: { name: SoundName; label: string }[] = [
  { name: 'select', label: 'Case selected' },
  { name: 'caseOpen', label: 'Case opening' },
  { name: 'reveal', label: 'Prize revealed' },
  { name: 'revealBig', label: 'Big prize revealed' },
  { name: 'phone', label: 'Banker calling' },
  { name: 'offer', label: 'Offer appears' },
  { name: 'deal', label: 'Deal accepted' },
  { name: 'noDeal', label: 'No deal' },
  { name: 'win', label: 'Win' },
  { name: 'loss', label: 'Loss' },
  { name: 'hover', label: 'Case hover' },
];

export function AudioSection({ config, update }: Props) {
  const { audio } = useSettings();
  const setAudio = (patch: Partial<AudioConfig>) => update({ audio: { ...config.audio, ...patch } });

  const test = (name: SoundName) => {
    audio.unlock();
    audio.setConfig({ ...config.audio, enabled: true });
    audio.play(name);
  };

  return (
    <div className="creator-section">
      <SectionHeader
        title="Audio"
        description="Every cue has a synthesised fallback, so sound works with no asset files at all. Point a cue at a URL to replace it; if the file fails to load the synth takes over."
      />

      <FieldGrid columns={4}>
        <SwitchField
          label="Sound enabled"
          checked={config.audio.enabled}
          onChange={(enabled) => setAudio({ enabled })}
        />
        <SliderField
          label="Master volume"
          value={Math.round(config.audio.masterVolume * 100)}
          suffix="%"
          onChange={(value) => setAudio({ masterVolume: value / 100 })}
        />
        <SliderField
          label="Effects volume"
          value={Math.round(config.audio.sfxVolume * 100)}
          suffix="%"
          onChange={(value) => setAudio({ sfxVolume: value / 100 })}
        />
        <SliderField
          label="Music volume"
          value={Math.round(config.audio.musicVolume * 100)}
          suffix="%"
          onChange={(value) => setAudio({ musicVolume: value / 100 })}
        />
      </FieldGrid>

      <TextField
        label="Background music URL"
        value={config.audio.musicUrl ?? ''}
        placeholder="https://…/loop.mp3 — empty uses the built-in ambient pad"
        onChange={(musicUrl) => setAudio({ musicUrl: musicUrl || undefined })}
      />

      <h3 className="creator-subhead">Sound effects</h3>
      <div className="cue-list">
        {CUES.map((cue) => (
          <div className="cue-row" key={cue.name}>
            <span className="cue-row__label">{cue.label}</span>
            <input
              className="input"
              value={config.audio.sources[cue.name] ?? ''}
              placeholder="Built-in synth"
              aria-label={`Audio URL for ${cue.label}`}
              onChange={(event) =>
                setAudio({
                  sources: { ...config.audio.sources, [cue.name]: event.target.value || undefined },
                })
              }
            />
            <button type="button" className="btn btn--sm btn--ghost" onClick={() => test(cue.name)}>
              Test
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
