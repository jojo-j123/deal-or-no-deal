import { useRef, useState } from 'react';
import type { GameConfig } from '../engine/types.ts';
import { demoGames } from '../presets/games.ts';
import { ConfigStore, importConfig } from '../engine/ConfigManager.ts';
import { ThemeManager } from '../theme/ThemeManager.ts';
import { formatValue } from '../engine/format.ts';
import { SettingsCluster } from './Controls.tsx';
import { CaseArt } from './CaseArt.tsx';

interface MenuScreenProps {
  onPlay: (config: GameConfig) => void;
  onEdit: (config: GameConfig) => void;
  onCreate: () => void;
}

export function MenuScreen({ onPlay, onEdit, onCreate }: MenuScreenProps) {
  const [saved, setSaved] = useState<GameConfig[]>(() => ConfigStore.list());
  const [notice, setNotice] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const handleImport = async (file: File) => {
    const { config, error } = importConfig(await file.text());
    if (!config) {
      setNotice(error ?? 'Could not read that file.');
      return;
    }
    ConfigStore.save(config);
    setSaved(ConfigStore.list());
    setNotice(`Imported “${config.gameTitle}”.`);
  };

  const handleDelete = (config: GameConfig) => {
    ConfigStore.remove(config.id);
    setSaved(ConfigStore.list());
    setNotice(`Deleted “${config.gameTitle}”.`);
  };

  return (
    <div className="menu">
      <div className="menu__glow" aria-hidden="true" />

      <header className="menu__head">
        <p className="eyebrow">A configurable game show engine</p>
        <h1 className="menu__title display gold-text">Deal or No Deal</h1>
        <p className="menu__tagline">
          One engine, any prizes. Cases hold whatever you decide — cash, gadgets, dragons —
          and the Banker still knows exactly what your case is worth.
        </p>
        <SettingsCluster />
      </header>

      <section className="menu__section" aria-labelledby="demo-games">
        <h2 className="menu__section-title" id="demo-games">Demo games</h2>
        <div className="menu__grid">
          {demoGames.map((game) => (
            <GameCard key={game.id} config={game} onPlay={onPlay} onEdit={onEdit} />
          ))}
        </div>
      </section>

      <section className="menu__section" aria-labelledby="your-games">
        <div className="menu__section-head">
          <h2 className="menu__section-title" id="your-games">Your games</h2>
          <div className="menu__section-actions">
            <button type="button" className="btn btn--sm btn--primary" onClick={onCreate}>
              Create a game
            </button>
            <button type="button" className="btn btn--sm btn--ghost" onClick={() => fileRef.current?.click()}>
              Import JSON
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
        </div>

        {saved.length === 0 ? (
          <p className="menu__empty text-muted">
            Nothing saved yet. Build one in the creator, or import a configuration file.
          </p>
        ) : (
          <div className="menu__grid">
            {saved.map((game) => (
              <GameCard
                key={game.id}
                config={game}
                onPlay={onPlay}
                onEdit={onEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
        {notice ? (
          <p className="menu__notice" role="status">{notice}</p>
        ) : null}
      </section>

      <footer className="menu__foot text-muted">
        <p>
          Keyboard: arrow keys move between cases, Enter opens. Motion and sound can be turned off
          at any time.
        </p>
      </footer>
    </div>
  );
}

function GameCard({
  config,
  onPlay,
  onEdit,
  onDelete,
}: {
  config: GameConfig;
  onPlay: (config: GameConfig) => void;
  onEdit: (config: GameConfig) => void;
  onDelete?: (config: GameConfig) => void;
}) {
  const topPrize = [...config.prizes].sort(
    (a, b) => (b.estimatedValue ?? 0) - (a.estimatedValue ?? 0),
  )[0];

  return (
    <article className="game-card panel" style={ThemeManager.toStyle(config.theme) as React.CSSProperties}>
      <div className="game-card__preview" aria-hidden="true">
        <div className="game-card__preview-bg" />
        <div className="game-card__preview-cases">
          {[1, 2, 3].map((n) => (
            <CaseArt key={n} number={n} />
          ))}
        </div>
      </div>

      <div className="game-card__body">
        <header className="game-card__head">
          <h3 className="game-card__title display">{config.gameTitle}</h3>
          <span className="chip chip--accent">{config.mode === 'money' ? 'Money' : 'Custom'}</span>
        </header>
        <p className="game-card__desc text-muted">{config.description}</p>
        <ul className="game-card__meta">
          <li>{config.caseCount} cases</li>
          <li>{config.rounds.length} rounds</li>
          <li>{config.theme.name} theme</li>
          {topPrize ? (
            <li className="game-card__top">
              Top: {topPrize.displayName || formatValue(topPrize.estimatedValue, config.valueFormat)}
            </li>
          ) : null}
        </ul>
        <div className="game-card__actions">
          <button type="button" className="btn btn--primary btn--sm" onClick={() => onPlay(config)}>
            Play
          </button>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => onEdit(config)}>
            {onDelete ? 'Edit' : 'Customise'}
          </button>
          {onDelete ? (
            <button
              type="button"
              className="btn btn--ghost btn--sm game-card__delete"
              onClick={() => onDelete(config)}
              aria-label={`Delete ${config.gameTitle}`}
            >
              Delete
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
