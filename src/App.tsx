import { useCallback, useEffect, useState } from 'react';
import type { GameConfig } from './engine/types.ts';
import { GameScreen } from './components/GameScreen.tsx';
import { MenuScreen } from './components/MenuScreen.tsx';
import { CreatorScreen } from './components/creator/CreatorScreen.tsx';
import { Stage } from './components/Stage.tsx';
import { ThemeManager, prefersReducedMotion, setReducedMotion } from './theme/ThemeManager.ts';
import { classicTheme } from './presets/themes.ts';
import { cloneGame } from './presets/games.ts';
import { useSettings } from './react/settings.tsx';

type View =
  | { kind: 'menu' }
  | { kind: 'game'; config: GameConfig; from: 'menu' | 'creator' }
  | { kind: 'creator'; config: GameConfig | null };

export function App() {
  const [view, setView] = useState<View>({ kind: 'menu' });
  const { settings } = useSettings();

  const activeTheme =
    view.kind === 'game' ? view.config.theme : view.kind === 'creator' && view.config ? view.config.theme : classicTheme;

  useEffect(() => {
    ThemeManager.apply(activeTheme);
  }, [activeTheme]);

  useEffect(() => {
    setReducedMotion(prefersReducedMotion());
  }, []);

  const play = useCallback((config: GameConfig, from: 'menu' | 'creator' = 'menu') => {
    // Cloned so a play session can never mutate a stored or preset config.
    setView({ kind: 'game', config: cloneGame(config), from });
  }, []);

  if (view.kind === 'game') {
    return (
      <GameScreen
        key={`${view.config.id}-${view.from}`}
        config={view.config}
        exitLabel={view.from === 'creator' ? 'Back to editor' : 'Back to games'}
        onExit={() =>
          setView(view.from === 'creator' ? { kind: 'creator', config: view.config } : { kind: 'menu' })
        }
      />
    );
  }

  if (view.kind === 'creator') {
    return (
      <CreatorScreen
        initialConfig={view.config}
        onExit={() => setView({ kind: 'menu' })}
        onPlaytest={(config) => play(config, 'creator')}
      />
    );
  }

  return (
    <Stage theme={classicTheme} reducedMotion={settings.reducedMotion}>
      <MenuScreen
        onPlay={(config) => play(config, 'menu')}
        onEdit={(config) => setView({ kind: 'creator', config: cloneGame(config) })}
        onCreate={() => setView({ kind: 'creator', config: null })}
      />
    </Stage>
  );
}
