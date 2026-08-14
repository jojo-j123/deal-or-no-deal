import { useEffect, useMemo, useRef, useState } from 'react';
import type { GameConfig } from '../../engine/types.ts';
import {
  ConfigStore,
  downloadConfig,
  importConfig,
  validateConfig,
} from '../../engine/ConfigManager.ts';
import { createBlankGame } from '../../presets/games.ts';
import { ThemeManager } from '../../theme/ThemeManager.ts';
import { GeneralSection } from './GeneralSection.tsx';
import { PrizesSection } from './PrizesSection.tsx';
import { RoundsSection } from './RoundsSection.tsx';
import { BankerSection } from './BankerSection.tsx';
import { ThemeSection } from './ThemeSection.tsx';
import { AudioSection } from './AudioSection.tsx';
import { DialogueSection } from './DialogueSection.tsx';

type TabId = 'general' | 'prizes' | 'rounds' | 'banker' | 'theme' | 'audio' | 'dialogue';

const TABS: { id: TabId; label: string; section: string }[] = [
  { id: 'general', label: 'General', section: 'general' },
  { id: 'prizes', label: 'Prizes', section: 'prizes' },
  { id: 'rounds', label: 'Rounds', section: 'rounds' },
  { id: 'banker', label: 'Banker', section: 'banker' },
  { id: 'theme', label: 'Theme', section: 'theme' },
  { id: 'audio', label: 'Audio', section: 'audio' },
  { id: 'dialogue', label: 'Dialogue', section: 'general' },
];

interface CreatorScreenProps {
  initialConfig: GameConfig | null;
  onExit: () => void;
  onPlaytest: (config: GameConfig) => void;
}

export function CreatorScreen({ initialConfig, onExit, onPlaytest }: CreatorScreenProps) {
  const [config, setConfig] = useState<GameConfig>(() => initialConfig ?? createBlankGame(12));
  const [tab, setTab] = useState<TabId>('general');
  const [notice, setNotice] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const update = (patch: Partial<GameConfig>) => setConfig((current) => ({ ...current, ...patch }));

  const issues = useMemo(() => validateConfig(config), [config]);
  const errors = issues.filter((issue) => issue.level === 'error');
  const warnings = issues.filter((issue) => issue.level === 'warning');
  const playable = errors.length === 0;

  // The editor wears the theme it is editing.
  useEffect(() => {
    ThemeManager.apply(config.theme);
  }, [config.theme]);

  useEffect(() => {
    if (!notice) return;
    const id = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(id);
  }, [notice]);

  const handleImport = async (file: File) => {
    const result = importConfig(await file.text());
    if (!result.config) {
      setNotice(result.error ?? 'Could not read that file.');
      return;
    }
    setConfig(result.config);
    setNotice(`Loaded “${result.config.gameTitle}”.`);
  };

  return (
    <div className="creator">
      <header className="creator__bar">
        <div className="creator__identity">
          <button type="button" className="btn btn--sm btn--ghost" onClick={onExit}>
            ← Games
          </button>
          <div>
            <p className="eyebrow">Game creator</p>
            <h1 className="creator__title display">{config.gameTitle || 'Untitled game'}</h1>
          </div>
        </div>

        <div className="creator__actions">
          <span className={`chip ${playable ? 'chip--accent' : 'chip--danger'}`}>
            {playable ? 'Playable' : `${errors.length} error${errors.length === 1 ? '' : 's'}`}
          </span>
          <button
            type="button"
            className="btn btn--sm btn--primary"
            disabled={!playable}
            onClick={() => onPlaytest(config)}
          >
            Playtest
          </button>
          <button
            type="button"
            className="btn btn--sm btn--ghost"
            onClick={() => {
              const saved = ConfigStore.save(config);
              setNotice(saved ? 'Saved to this browser.' : 'Could not save — storage is unavailable.');
            }}
          >
            Save
          </button>
          <button type="button" className="btn btn--sm btn--ghost" onClick={() => downloadConfig(config)}>
            Export
          </button>
          <button type="button" className="btn btn--sm btn--ghost" onClick={() => fileRef.current?.click()}>
            Import
          </button>
          <button
            type="button"
            className="btn btn--sm btn--ghost"
            onClick={() => {
              setConfig(initialConfig ?? createBlankGame(12));
              setNotice('Configuration reset.');
            }}
          >
            Reset
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleImport(file);
              event.target.value = '';
            }}
          />
        </div>
      </header>

      {notice ? (
        <p className="creator__notice" role="status">
          {notice}
        </p>
      ) : null}

      {errors.length > 0 || warnings.length > 0 ? (
        <ul className="issue-list creator__issues">
          {[...errors, ...warnings].map((issue, index) => (
            <li key={index} className="issue" data-level={issue.level}>
              <strong>{issue.section}</strong> — {issue.message}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="creator__body">
        <nav className="creator__tabs" aria-label="Creator sections">
          {TABS.map((entry) => {
            const sectionErrors = errors.filter((issue) => issue.section === entry.section).length;
            return (
              <button
                key={entry.id}
                type="button"
                className="creator__tab"
                data-active={tab === entry.id}
                aria-current={tab === entry.id ? 'page' : undefined}
                onClick={() => setTab(entry.id)}
              >
                <span>{entry.label}</span>
                {sectionErrors > 0 ? <span className="creator__tab-dot" aria-label="has errors" /> : null}
              </button>
            );
          })}
        </nav>

        <main className="creator__content panel">
          {tab === 'general' ? (
            <GeneralSection config={config} update={update} replace={setConfig} />
          ) : null}
          {tab === 'prizes' ? <PrizesSection config={config} update={update} /> : null}
          {tab === 'rounds' ? <RoundsSection config={config} update={update} /> : null}
          {tab === 'banker' ? <BankerSection config={config} update={update} /> : null}
          {tab === 'theme' ? <ThemeSection config={config} update={update} /> : null}
          {tab === 'audio' ? <AudioSection config={config} update={update} /> : null}
          {tab === 'dialogue' ? <DialogueSection config={config} update={update} /> : null}
        </main>
      </div>
    </div>
  );
}
