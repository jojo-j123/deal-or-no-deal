import type { CaseStyle, ButtonStyle, GameConfig, ThemeConfig } from '../../engine/types.ts';
import { cloneTheme, themePresets } from '../../presets/themes.ts';
import { CaseArt } from '../CaseArt.tsx';
import {
  ColorField,
  FieldGrid,
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
}

const MATERIALS: { label: string; value: string }[] = [
  {
    label: 'Brushed steel',
    value:
      'linear-gradient(155deg, #f4f7fa 0%, #c2cbd6 22%, #8e99a7 48%, #6a7482 62%, #aab4c1 84%, #dfe6ee 100%)',
  },
  {
    label: 'Gold bullion',
    value:
      'linear-gradient(155deg, #fff3c9 0%, #e8c268 26%, #a9822c 52%, #7a5c19 66%, #e2bd63 88%, #fff6d8 100%)',
  },
  {
    label: 'Obsidian',
    value: 'linear-gradient(155deg, #4a4f57 0%, #23272d 30%, #101216 58%, #2c3138 80%, #565c66 100%)',
  },
  {
    label: 'Deep violet',
    value: 'linear-gradient(155deg, #3b1f6e 0%, #241150 26%, #150a33 55%, #2b1560 78%, #4a2a8a 100%)',
  },
  {
    label: 'Candy',
    value: 'linear-gradient(155deg, #ff6f61 0%, #ffb03a 30%, #21d4fd 62%, #7a5cff 100%)',
  },
];

const FONTS: { label: string; value: string }[] = [
  { label: 'Condensed display', value: "'Bebas Neue', 'Oswald', Impact, 'Arial Narrow', sans-serif" },
  { label: 'Techno', value: "'Orbitron', 'Bebas Neue', 'Trebuchet MS', sans-serif" },
  { label: 'Engraved serif', value: "'Cinzel', Georgia, 'Times New Roman', serif" },
  { label: 'Grotesk', value: "'Inter', system-ui, sans-serif" },
  { label: 'Monospace', value: "'JetBrains Mono', 'SFMono-Regular', Menlo, monospace" },
];

export function ThemeSection({ config, update }: Props) {
  const theme = config.theme;
  const setTheme = (patch: Partial<ThemeConfig>) => update({ theme: { ...theme, ...patch } });

  return (
    <div className="creator-section">
      <SectionHeader
        title="Theme"
        description="Everything here is a CSS variable at runtime, so the whole game repaints as you type."
      />

      <h3 className="creator-subhead">Presets</h3>
      <div className="theme-presets">
        {themePresets.map((preset) => (
          <button
            type="button"
            key={preset.id}
            className="theme-preset"
            data-active={theme.id === preset.id}
            onClick={() => setTheme(cloneTheme(preset))}
            style={
              {
                '--preview-bg': preset.background.value,
                '--preview-primary': preset.colors.primary,
                '--preview-accent': preset.colors.accent,
              } as React.CSSProperties
            }
          >
            <span className="theme-preset__swatch" />
            <span className="theme-preset__name">{preset.name}</span>
          </button>
        ))}
      </div>

      <ThemePreview theme={theme} title={config.gameTitle} />

      <h3 className="creator-subhead">Identity</h3>
      <FieldGrid>
        <TextField
          label="Theme name"
          value={theme.name}
          onChange={(name) => setTheme({ name, id: 'custom' })}
        />
        <TextField
          label="Logo text"
          value={theme.logo.text ?? ''}
          placeholder={config.gameTitle}
          onChange={(text) => setTheme({ logo: { ...theme.logo, text: text || undefined } })}
        />
        <TextField
          label="Logo subtitle"
          value={theme.logo.subtitle ?? ''}
          onChange={(subtitle) => setTheme({ logo: { ...theme.logo, subtitle: subtitle || undefined } })}
        />
        <TextField
          label="Logo image URL"
          value={theme.logo.imageUrl ?? ''}
          onChange={(imageUrl) => setTheme({ logo: { ...theme.logo, imageUrl: imageUrl || undefined } })}
        />
      </FieldGrid>

      <h3 className="creator-subhead">Colours</h3>
      <FieldGrid columns={4}>
        <ColorField label="Primary" value={theme.colors.primary} onChange={(primary) => setTheme({ colors: { ...theme.colors, primary } })} />
        <ColorField label="Secondary" value={theme.colors.secondary} onChange={(secondary) => setTheme({ colors: { ...theme.colors, secondary } })} />
        <ColorField label="Accent" value={theme.colors.accent} onChange={(accent) => setTheme({ colors: { ...theme.colors, accent } })} />
        <ColorField label="Text" value={theme.colors.text} onChange={(text) => setTheme({ colors: { ...theme.colors, text } })} />
        <ColorField label="Muted text" value={theme.colors.textMuted} onChange={(textMuted) => setTheme({ colors: { ...theme.colors, textMuted } })} />
        <ColorField label="Danger" value={theme.colors.danger} onChange={(danger) => setTheme({ colors: { ...theme.colors, danger } })} />
        <ColorField label="Success" value={theme.colors.success} onChange={(success) => setTheme({ colors: { ...theme.colors, success } })} />
        <ColorField label="Case glow" value={theme.caseGlow} onChange={(caseGlow) => setTheme({ caseGlow })} />
      </FieldGrid>

      <h3 className="creator-subhead">Background</h3>
      <FieldGrid>
        <SelectField
          label="Type"
          value={theme.background.type}
          options={[
            { value: 'gradient', label: 'Gradient' },
            { value: 'solid', label: 'Solid colour' },
            { value: 'image', label: 'Image' },
          ]}
          onChange={(type) => setTheme({ background: { ...theme.background, type } })}
        />
        <TextField
          label="Image URL"
          value={theme.background.image ?? ''}
          onChange={(image) => setTheme({ background: { ...theme.background, image: image || undefined } })}
        />
      </FieldGrid>
      <TextArea
        label="Background CSS"
        value={theme.background.value}
        rows={2}
        hint="Any CSS colour or gradient."
        onChange={(value) => setTheme({ background: { ...theme.background, value } })}
      />

      <h3 className="creator-subhead">Cases</h3>
      <FieldGrid>
        <SelectField
          label="Case style"
          value={theme.caseStyle}
          options={[
            { value: 'metal', label: 'Metal' },
            { value: 'glass', label: 'Glass' },
            { value: 'neon', label: 'Neon' },
            { value: 'matte', label: 'Matte' },
            { value: 'carbon', label: 'Carbon' },
          ]}
          onChange={(caseStyle) => setTheme({ caseStyle: caseStyle as CaseStyle })}
        />
        <SelectField
          label="Case material"
          value={MATERIALS.find((m) => m.value === theme.caseMaterial)?.label ?? 'Custom'}
          options={[...MATERIALS.map((m) => ({ value: m.label, label: m.label })), { value: 'Custom', label: 'Custom' }]}
          onChange={(label) => {
            const match = MATERIALS.find((m) => m.label === label);
            if (match) setTheme({ caseMaterial: match.value });
          }}
        />
        <SelectField
          label="Button style"
          value={theme.buttonStyle}
          options={[
            { value: 'gold', label: 'Gold' },
            { value: 'neon', label: 'Neon' },
            { value: 'glass', label: 'Glass' },
            { value: 'solid', label: 'Solid' },
          ]}
          onChange={(buttonStyle) => setTheme({ buttonStyle: buttonStyle as ButtonStyle })}
        />
        <SelectField
          label="Display font"
          value={FONTS.find((f) => f.value === theme.fonts.display)?.value ?? FONTS[0].value}
          options={FONTS.map((f) => ({ value: f.value, label: f.label }))}
          onChange={(display) => setTheme({ fonts: { ...theme.fonts, display } })}
        />
      </FieldGrid>
      <TextArea
        label="Case material CSS"
        value={theme.caseMaterial}
        rows={2}
        onChange={(caseMaterial) => setTheme({ caseMaterial })}
      />

      <h3 className="creator-subhead">Atmosphere</h3>
      <FieldGrid>
        <SliderField
          label="Glow intensity"
          value={theme.effects.glow}
          onChange={(glow) => setTheme({ effects: { ...theme.effects, glow } })}
        />
        <SliderField
          label="Vignette"
          value={theme.effects.vignette}
          onChange={(vignette) => setTheme({ effects: { ...theme.effects, vignette } })}
        />
        <SwitchField
          label="Particles"
          checked={theme.effects.particles}
          onChange={(particles) => setTheme({ effects: { ...theme.effects, particles } })}
        />
        <SwitchField
          label="Moving spotlights"
          checked={theme.effects.spotlight}
          onChange={(spotlight) => setTheme({ effects: { ...theme.effects, spotlight } })}
        />
        <SwitchField
          label="Scanlines"
          checked={theme.effects.scanlines}
          onChange={(scanlines) => setTheme({ effects: { ...theme.effects, scanlines } })}
        />
        <SwitchField
          label="Film grain"
          checked={theme.effects.grain}
          onChange={(grain) => setTheme({ effects: { ...theme.effects, grain } })}
        />
      </FieldGrid>

      <h3 className="creator-subhead">Banker</h3>
      <FieldGrid columns={3}>
        <TextField
          label="Banker emoji"
          value={theme.banker.emoji}
          onChange={(emoji) => setTheme({ banker: { ...theme.banker, emoji } })}
        />
        <TextField
          label="Banker avatar URL"
          value={theme.banker.avatarUrl ?? ''}
          onChange={(avatarUrl) => setTheme({ banker: { ...theme.banker, avatarUrl: avatarUrl || undefined } })}
        />
        <TextField
          label="Banker room image URL"
          value={theme.banker.roomImage ?? ''}
          onChange={(roomImage) => setTheme({ banker: { ...theme.banker, roomImage: roomImage || undefined } })}
        />
      </FieldGrid>
    </div>
  );
}

function ThemePreview({ theme, title }: { theme: ThemeConfig; title: string }) {
  return (
    <div
      className="theme-preview"
      data-case-style={theme.caseStyle}
      data-button-style={theme.buttonStyle}
      style={
        {
          '--bg-base': theme.background.value,
          '--c-primary': theme.colors.primary,
          '--c-secondary': theme.colors.secondary,
          '--c-accent': theme.colors.accent,
          '--c-text': theme.colors.text,
          '--c-muted': theme.colors.textMuted,
          '--case-material': theme.caseMaterial,
          '--case-glow': theme.caseGlow,
          '--font-display': theme.fonts.display,
        } as React.CSSProperties
      }
    >
      <div className="theme-preview__bg" />
      <div className="theme-preview__content">
        <p className="theme-preview__title display">{theme.logo.text || title}</p>
        <div className="theme-preview__cases">
          {[1, 2, 3, 4].map((n) => (
            <CaseArt key={n} number={n} state={n === 2 ? 'player' : 'idle'} />
          ))}
        </div>
        <div className="theme-preview__buttons">
          <span className="btn btn--sm btn--primary">Deal</span>
          <span className="btn btn--sm btn--danger">No Deal</span>
        </div>
      </div>
    </div>
  );
}
