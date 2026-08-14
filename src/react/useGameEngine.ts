import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GameEngine } from '../engine/GameEngine.ts';
import type { GameConfig, GameState } from '../engine/types.ts';
import { useSettings } from './settings.tsx';

/** How long each dramatic beat lasts, in milliseconds. */
const TIMING = {
  reveal: 2600,
  revealBig: 4000,
  bankerCalling: 2600,
  shake: 700,
};

export interface StageEffects {
  shake: boolean;
  burst: 'none' | 'big' | 'win';
  confetti: boolean;
}

export interface GameController {
  engine: GameEngine;
  state: GameState;
  config: GameConfig;
  effects: StageEffects;
  /** Reveal countdown is running — clicking anywhere skips the rest of it. */
  canSkipReveal: boolean;
  pickOwnCase: (caseId: number) => void;
  openCase: (caseId: number) => void;
  skipReveal: () => void;
  acceptDeal: () => void;
  declineDeal: () => void;
  chooseFinal: (choice: 'keep' | 'swap') => void;
  restart: () => void;
  hoverCase: () => void;
}

/**
 * Binds the pure engine to React and owns everything time-based: how long a
 * reveal lingers, when the Banker's phone stops ringing, when the screen
 * shakes. The engine itself has no timers.
 */
export function useGameEngine(config: GameConfig, autoStart = true): GameController {
  const { audio, settings } = useSettings();
  const engine = useMemo(() => new GameEngine(config), [config]);
  const [state, setState] = useState<GameState>(() => engine.getState());
  const [effects, setEffects] = useState<StageEffects>({ shake: false, burst: 'none', confetti: false });
  const timers = useRef<number[]>([]);
  const reducedMotion = settings.reducedMotion;

  const clearTimers = useCallback(() => {
    for (const id of timers.current) window.clearTimeout(id);
    timers.current = [];
  }, []);

  const later = useCallback((fn: () => void, delay: number) => {
    const id = window.setTimeout(fn, delay);
    timers.current.push(id);
    return id;
  }, []);

  /* ------------------------------------------------------- engine plumbing */

  useEffect(() => {
    const unsubscribe = engine.subscribe(setState);
    if (autoStart) engine.start();
    return () => {
      unsubscribe();
      clearTimers();
    };
  }, [engine, autoStart, clearTimers]);

  useEffect(() => {
    audio.setConfig({
      ...config.audio,
      enabled: config.audio.enabled && settings.sound,
    });
    if (settings.music && settings.sound) audio.startMusic();
    else audio.stopMusic();
    return () => audio.stopMusic();
  }, [audio, config.audio, settings.sound, settings.music]);

  useEffect(() => {
    return engine.onEvent((event) => {
      switch (event.type) {
        case 'case:pick-own':
          audio.play('select');
          break;
        case 'case:open':
          audio.play('caseOpen');
          later(() => audio.play(event.isBig ? 'revealBig' : 'reveal'), 700);
          if (event.isBig && !reducedMotion) {
            setEffects((fx) => ({ ...fx, shake: true, burst: 'big' }));
            later(() => setEffects((fx) => ({ ...fx, shake: false })), TIMING.shake);
            later(() => setEffects((fx) => ({ ...fx, burst: 'none' })), 1600);
          }
          break;
        case 'banker:calling':
          audio.play('phone');
          break;
        case 'banker:offer':
          audio.play('offer');
          break;
        case 'player:deal':
          audio.play('deal');
          break;
        case 'player:no-deal':
          audio.play('noDeal');
          break;
        case 'game:end': {
          const good = event.result.percentile >= 0.5;
          later(() => audio.play(good ? 'win' : 'loss'), 400);
          if (good && !reducedMotion) {
            setEffects((fx) => ({ ...fx, confetti: true, burst: 'win' }));
            later(() => setEffects((fx) => ({ ...fx, burst: 'none' })), 2000);
          }
          break;
        }
        default:
          break;
      }
    });
  }, [engine, audio, later, reducedMotion]);

  /* ----------------------------------------------------------- auto beats */

  useEffect(() => {
    if (state.phase !== 'reveal' || !state.lastReveal) return;
    const duration = reducedMotion
      ? 900
      : state.lastReveal.isBig
        ? TIMING.revealBig
        : TIMING.reveal;
    const id = window.setTimeout(() => engine.dismissReveal(), duration);
    return () => window.clearTimeout(id);
  }, [engine, state.phase, state.lastReveal, reducedMotion]);

  useEffect(() => {
    if (state.phase !== 'banker-calling') return;
    const id = window.setTimeout(
      () => engine.revealOffer(),
      reducedMotion ? 700 : TIMING.bankerCalling,
    );
    return () => window.clearTimeout(id);
  }, [engine, state.phase, reducedMotion]);

  /* -------------------------------------------------------------- actions */

  const pickOwnCase = useCallback((caseId: number) => {
    audio.unlock();
    engine.pickOwnCase(caseId);
  }, [engine, audio]);

  const openCase = useCallback((caseId: number) => {
    audio.unlock();
    engine.openCase(caseId);
  }, [engine, audio]);

  const skipReveal = useCallback(() => {
    if (engine.getState().phase === 'reveal') engine.dismissReveal();
  }, [engine]);

  const acceptDeal = useCallback(() => engine.acceptDeal(), [engine]);
  const declineDeal = useCallback(() => engine.declineDeal(), [engine]);
  const chooseFinal = useCallback((choice: 'keep' | 'swap') => engine.chooseFinal(choice), [engine]);

  const restart = useCallback(() => {
    clearTimers();
    setEffects({ shake: false, burst: 'none', confetti: false });
    engine.restart();
  }, [engine, clearTimers]);

  const hoverCase = useCallback(() => audio.play('hover'), [audio]);

  return {
    engine,
    state,
    config,
    effects,
    canSkipReveal: state.phase === 'reveal',
    pickOwnCase,
    openCase,
    skipReveal,
    acceptDeal,
    declineDeal,
    chooseFinal,
    restart,
    hoverCase,
  };
}
