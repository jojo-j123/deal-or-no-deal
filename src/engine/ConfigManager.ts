import type {
  AudioConfig,
  BankerConfig,
  DialogueConfig,
  GameConfig,
  GameRules,
  Prize,
  ThemeConfig,
} from './types.ts';
import { RoundManager } from './RoundManager.ts';
import { defaultValueFormat } from './format.ts';
import { classicTheme, cloneTheme } from '../presets/themes.ts';
import { uid } from './rng.ts';

export const SCHEMA_VERSION = 1;
export const MIN_CASES = 4;
export const MAX_CASES = 60;
export const CASE_COUNT_OPTIONS = [8, 10, 12, 16, 20, 24, 26, 30, 32, 50];

const STORAGE_KEY = 'dond.customGames.v1';
const LAST_PLAYED_KEY = 'dond.lastPlayed.v1';

/* ------------------------------------------------------------------ defaults */

export function defaultBanker(): BankerConfig {
  return {
    name: 'The Banker',
    personality: 'showman',
    aggressiveness: 55,
    generosity: 45,
    risk: 50,
    variancePenalty: 60,
    jitter: 25,
    rounding: 'nice',
    offerPresentation: 'value',
    bundleCatalog: [],
    countdownSeconds: 0,
  };
}

export function defaultAudio(): AudioConfig {
  return {
    enabled: true,
    masterVolume: 0.7,
    musicVolume: 0.35,
    sfxVolume: 0.8,
    sources: {},
  };
}

export function defaultRules(): GameRules {
  return {
    allowSwapAtEnd: true,
    showValuesOnBoard: false,
    bigPrizePercentile: 0.72,
    revealPlayerCaseAfterDeal: true,
  };
}

export function defaultDialogue(): DialogueConfig {
  return {
    pickOwnCase: 'Choose the case you will keep for the rest of the game.',
    roundStart: ['Round {round} — open {count} cases.', '{count} cases to open. Choose carefully.'],
    caseOpen: ['{count} more to go.', 'Keep going — {count} left this round.'],
    revealHigh: ['Ouch. {prize} is gone.', 'That one hurts — {prize}.'],
    revealLow: ['Good riddance. {prize} is off the board.', 'Nicely done — {prize} eliminated.'],
    bankerCalling: ['{banker} is calling…', 'The phone rings. {banker} has seen enough.'],
    offer: [
      '{banker} offers you {offer}.',
      'The offer on the table is {offer}.',
      '{banker} will buy your case for {offer}.',
    ],
    deal: ['DEAL! You leave with {offer}.', 'Sold. {offer} is yours.'],
    noDeal: ['NO DEAL! Back to the board.', 'You turned it down. Bold.'],
    finalTwo: 'Two cases left: yours (#{caseA}) and #{caseB}. Keep it, or swap?',
    victory: ['You played it perfectly. {prize} is yours.', 'What a game — you win {prize}!'],
    loss: ['It was not to be. You leave with {prize}.', 'Tough break — {prize}.'],
  };
}

export function createPrize(partial: Partial<Prize> = {}): Prize {
  const name = partial.name ?? 'New Prize';
  return {
    id: partial.id ?? uid('prize'),
    name,
    displayName: partial.displayName ?? name,
    estimatedValue: partial.estimatedValue,
    icon: partial.icon,
    description: partial.description,
    rarity: partial.rarity,
  };
}

export function createConfig(partial: Partial<GameConfig> = {}): GameConfig {
  const caseCount = clampCaseCount(partial.caseCount ?? partial.prizes?.length ?? 26);
  const prizes = partial.prizes ?? [];
  return {
    schemaVersion: SCHEMA_VERSION,
    id: partial.id ?? uid('game'),
    gameTitle: partial.gameTitle ?? 'Untitled Game',
    description: partial.description ?? '',
    mode: partial.mode ?? 'money',
    caseCount,
    prizes,
    rounds: partial.rounds ?? RoundManager.generate(caseCount),
    banker: { ...defaultBanker(), ...partial.banker },
    theme: partial.theme ? { ...cloneTheme(classicTheme), ...partial.theme } : cloneTheme(classicTheme),
    audio: { ...defaultAudio(), ...partial.audio },
    dialogue: { ...defaultDialogue(), ...partial.dialogue },
    rules: { ...defaultRules(), ...partial.rules },
    valueFormat: { ...defaultValueFormat, ...partial.valueFormat },
  };
}

export function clampCaseCount(count: number): number {
  if (!Number.isFinite(count)) return 26;
  return Math.min(MAX_CASES, Math.max(MIN_CASES, Math.round(count)));
}

/* ---------------------------------------------------------------- validation */

export interface ConfigIssue {
  level: 'error' | 'warning';
  section: 'general' | 'prizes' | 'rounds' | 'banker' | 'theme' | 'audio';
  message: string;
}

export function validateConfig(config: GameConfig): ConfigIssue[] {
  const issues: ConfigIssue[] = [];

  if (!config.gameTitle.trim()) {
    issues.push({ level: 'error', section: 'general', message: 'Give the game a title.' });
  }
  if (config.caseCount < MIN_CASES || config.caseCount > MAX_CASES) {
    issues.push({
      level: 'error',
      section: 'general',
      message: `Case count must be between ${MIN_CASES} and ${MAX_CASES}.`,
    });
  }
  if (config.prizes.length !== config.caseCount) {
    issues.push({
      level: 'error',
      section: 'prizes',
      message: `${config.prizes.length} prizes for ${config.caseCount} cases — every case needs exactly one prize.`,
    });
  }
  if (config.prizes.some((p) => !p.displayName.trim())) {
    issues.push({ level: 'error', section: 'prizes', message: 'Every prize needs a display name.' });
  }
  const ids = new Set<string>();
  for (const prize of config.prizes) {
    if (ids.has(prize.id)) {
      issues.push({ level: 'error', section: 'prizes', message: `Duplicate prize id: ${prize.id}.` });
      break;
    }
    ids.add(prize.id);
  }
  const valued = config.prizes.filter((p) => typeof p.estimatedValue === 'number');
  if (valued.length === 0) {
    issues.push({
      level: 'warning',
      section: 'prizes',
      message: 'No estimated values set — the Banker will always offer nothing.',
    });
  } else if (valued.length < config.prizes.length) {
    issues.push({
      level: 'warning',
      section: 'prizes',
      message: `${config.prizes.length - valued.length} prizes have no estimated value and count as zero.`,
    });
  }

  for (const issue of RoundManager.validate(config.rounds, config.caseCount).issues) {
    issues.push({ level: issue.level, section: 'rounds', message: issue.message });
  }

  if (config.banker.offerPresentation === 'bundle' && config.banker.bundleCatalog.length === 0) {
    issues.push({
      level: 'warning',
      section: 'banker',
      message: 'Bundle offers need at least one item in the Banker’s catalogue.',
    });
  }
  if (!config.banker.name.trim()) {
    issues.push({ level: 'warning', section: 'banker', message: 'The Banker has no name.' });
  }

  return issues;
}

export function isPlayable(config: GameConfig): boolean {
  return validateConfig(config).every((issue) => issue.level !== 'error');
}

/* -------------------------------------------------------- import and export */

export function exportConfig(config: GameConfig): string {
  return JSON.stringify(config, null, 2);
}

export interface ImportResult {
  config: GameConfig | null;
  error: string | null;
}

/**
 * Import is deliberately forgiving: anything missing is filled from defaults so
 * a hand-written or older file still loads.
 */
export function importConfig(json: string): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { config: null, error: 'That file is not valid JSON.' };
  }
  if (!parsed || typeof parsed !== 'object') {
    return { config: null, error: 'That file does not contain a game configuration.' };
  }

  const raw = parsed as Partial<GameConfig>;
  if (!Array.isArray(raw.prizes)) {
    return { config: null, error: 'The configuration has no prize list.' };
  }

  const prizes = raw.prizes.map((prize) => createPrize(prize));
  const caseCount = clampCaseCount(raw.caseCount ?? prizes.length);
  const theme: ThemeConfig = raw.theme
    ? { ...cloneTheme(classicTheme), ...raw.theme,
        colors: { ...classicTheme.colors, ...raw.theme.colors },
        effects: { ...classicTheme.effects, ...raw.theme.effects },
        background: { ...classicTheme.background, ...raw.theme.background },
        fonts: { ...classicTheme.fonts, ...raw.theme.fonts },
        logo: { ...classicTheme.logo, ...raw.theme.logo },
        banker: { ...classicTheme.banker, ...raw.theme.banker } }
    : cloneTheme(classicTheme);

  const config = createConfig({
    ...raw,
    id: raw.id ?? uid('game'),
    prizes,
    caseCount,
    theme,
    rounds: Array.isArray(raw.rounds) && raw.rounds.length > 0
      ? raw.rounds.map((r, i) => ({
          id: r.id ?? uid('round'),
          casesToOpen: Math.max(1, Math.round(r.casesToOpen ?? 1)),
          offerAfter: r.offerAfter ?? true,
          label: r.label ?? `Round ${i + 1}`,
        }))
      : RoundManager.generate(caseCount),
  });

  return { config, error: null };
}

/* ------------------------------------------------------------ local storage */

function readStore(): Record<string, GameConfig> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, GameConfig>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(store: Record<string, GameConfig>): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    return true;
  } catch {
    return false;
  }
}

export const ConfigStore = {
  list(): GameConfig[] {
    return Object.values(readStore()).sort((a, b) => a.gameTitle.localeCompare(b.gameTitle));
  },
  save(config: GameConfig): boolean {
    const store = readStore();
    store[config.id] = config;
    return writeStore(store);
  },
  load(id: string): GameConfig | null {
    return readStore()[id] ?? null;
  },
  remove(id: string): boolean {
    const store = readStore();
    delete store[id];
    return writeStore(store);
  },
  rememberLast(id: string): void {
    try {
      localStorage.setItem(LAST_PLAYED_KEY, id);
    } catch {
      /* storage unavailable — not worth interrupting the game for */
    }
  },
  lastPlayed(): string | null {
    try {
      return localStorage.getItem(LAST_PLAYED_KEY);
    } catch {
      return null;
    }
  },
};

/** Download the config as a .json file (browser only). */
export function downloadConfig(config: GameConfig): void {
  const blob = new Blob([exportConfig(config)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${slugify(config.gameTitle)}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'game'
  );
}
