/**
 * Core data model for the game engine.
 *
 * Nothing in this file knows about money, React, the DOM, or any particular
 * theme. A "prize" is an opaque token with an optional numeric value that the
 * Banker uses for arithmetic; everything the player sees comes from config.
 */

export type PrizeRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface Prize {
  id: string;
  /** Internal identifier, used in the creator UI and exports. */
  name: string;
  /** What the player actually sees on the board and in the reveal. */
  displayName: string;
  /** Optional numeric worth. Used only by the Banker's arithmetic. */
  estimatedValue?: number;
  /** Optional image URL (data URIs are fine). */
  image?: string;
  /** Optional short glyph/emoji shown when no image is supplied. */
  icon?: string;
  description?: string;
  rarity?: PrizeRarity;
}

/** How a numeric value is turned into a string. Never hardcode "$". */
export interface ValueFormat {
  style: 'currency' | 'number' | 'compact' | 'none';
  /** ISO currency code, used when style === 'currency'. */
  currency: string;
  locale: string;
  prefix: string;
  suffix: string;
  maximumFractionDigits: number;
}

export interface RoundPlan {
  id: string;
  casesToOpen: number;
  /** Whether the Banker calls after this round completes. */
  offerAfter: boolean;
  label?: string;
}

export type BankerPersonality =
  | 'fair'
  | 'ruthless'
  | 'generous'
  | 'chaotic'
  | 'showman';

/** An item the Banker can bundle into a non-monetary offer. */
export interface BundleItem {
  id: string;
  displayName: string;
  value: number;
  icon?: string;
}

export interface BankerConfig {
  name: string;
  personality: BankerPersonality;
  /** 0-100. Higher pushes offers down (hard bargainer). */
  aggressiveness: number;
  /** 0-100. Higher pushes offers up. */
  generosity: number;
  /** 0-100. Higher weights the valuation toward the top prizes still in play. */
  risk: number;
  /** 0-100. How much a wide spread of remaining prizes discounts the offer. */
  variancePenalty: number;
  /** 0-100. Random swing applied to each offer. */
  jitter: number;
  rounding: 'none' | 'nice' | 'whole';
  /** Show a number, or compose a bundle of items worth roughly the offer. */
  offerPresentation: 'value' | 'bundle';
  bundleCatalog: BundleItem[];
  /** 0 disables the countdown on the offer screen. */
  countdownSeconds: number;
}

export type CaseStyle = 'metal' | 'glass' | 'neon' | 'matte' | 'carbon';
export type ButtonStyle = 'gold' | 'neon' | 'glass' | 'solid';

export interface ThemeConfig {
  id: string;
  name: string;
  background: {
    type: 'gradient' | 'solid' | 'image';
    /** A CSS color or gradient. */
    value: string;
    /** Optional image URL layered under the gradient. */
    image?: string;
    /** 0-100 darkening applied over the image. */
    overlay: number;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    textMuted: string;
    surface: string;
    danger: string;
    success: string;
  };
  caseStyle: CaseStyle;
  /** CSS gradient describing the face of a case. */
  caseMaterial: string;
  caseGlow: string;
  buttonStyle: ButtonStyle;
  fonts: {
    display: string;
    body: string;
  };
  effects: {
    /** 0-100 multiplier on every glow in the UI. */
    glow: number;
    particles: boolean;
    /** 0-100 corner darkening. */
    vignette: number;
    scanlines: boolean;
    grain: boolean;
    /** Slow drifting spotlight behind the stage. */
    spotlight: boolean;
  };
  logo: {
    text?: string;
    subtitle?: string;
    imageUrl?: string;
  };
  banker: {
    /** Emoji/glyph used when no avatar image is provided. */
    emoji: string;
    avatarUrl?: string;
    roomImage?: string;
  };
}

export interface AudioConfig {
  enabled: boolean;
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  /** Optional URLs. Missing/failing assets fall back to synthesised tones. */
  sources: Partial<Record<SoundName, string>>;
  musicUrl?: string;
}

export type SoundName =
  | 'hover'
  | 'select'
  | 'caseOpen'
  | 'reveal'
  | 'revealBig'
  | 'eliminate'
  | 'phone'
  | 'offer'
  | 'deal'
  | 'noDeal'
  | 'tick'
  | 'win'
  | 'loss'
  | 'click';

export interface DialogueConfig {
  pickOwnCase: string;
  roundStart: string[];
  caseOpen: string[];
  revealHigh: string[];
  revealLow: string[];
  bankerCalling: string[];
  offer: string[];
  deal: string[];
  noDeal: string[];
  finalTwo: string;
  victory: string[];
  loss: string[];
}

export interface GameRules {
  /** Offer the player a swap when two cases remain. */
  allowSwapAtEnd: boolean;
  /** Show numeric estimated values next to prize names on the board. */
  showValuesOnBoard: boolean;
  /** A prize at or above this percentile of all values counts as a "big" reveal. */
  bigPrizePercentile: number;
  /** Compare the accepted deal against the player's case at the end. */
  revealPlayerCaseAfterDeal: boolean;
}

export interface GameConfig {
  schemaVersion: number;
  id: string;
  gameTitle: string;
  description: string;
  mode: 'money' | 'custom';
  caseCount: number;
  prizes: Prize[];
  rounds: RoundPlan[];
  banker: BankerConfig;
  theme: ThemeConfig;
  audio: AudioConfig;
  dialogue: DialogueConfig;
  rules: GameRules;
  valueFormat: ValueFormat;
}

/* -------------------------------------------------------------------------- */
/* Runtime state                                                              */
/* -------------------------------------------------------------------------- */

export interface CaseState {
  id: number;
  /** The number printed on the case. */
  number: number;
  prizeId: string;
  opened: boolean;
  isPlayerCase: boolean;
  openedInRound: number | null;
}

export type GamePhase =
  | 'setup'
  | 'pick-own'
  | 'opening'
  | 'reveal'
  | 'banker-calling'
  | 'offer'
  | 'final-choice'
  | 'ended';

export interface OfferBreakdown {
  average: number;
  weighted: number;
  highest: number;
  lowest: number;
  remainingCases: number;
  roundFactor: number;
  spreadPenalty: number;
  personalityFactor: number;
  jitterFactor: number;
  raw: number;
  final: number;
}

export interface Offer {
  id: string;
  round: number;
  value: number;
  /** Items shown instead of a number when presentation is 'bundle'. */
  bundle: BundleItem[];
  breakdown: OfferBreakdown;
  line: string;
  accepted: boolean | null;
}

export interface RevealInfo {
  caseId: number;
  caseNumber: number;
  prize: Prize;
  /** True when the prize sits in the top band of all configured values. */
  isBig: boolean;
  line: string;
}

export type GameOutcome = 'deal' | 'final-case';

export interface GameResult {
  outcome: GameOutcome;
  /** What the player walks away with. */
  wonPrize: Prize | null;
  /** Value of an accepted offer, when outcome === 'deal'. */
  wonValue: number | null;
  wonLabel: string;
  /** What was in the player's own case, revealed at the end. */
  playerPrize: Prize;
  /** For a deal: how the offer compared with the case they gave up. */
  betterThanCase: boolean | null;
  /** Rank of the result among all configured prizes, 0 (worst) to 1 (best). */
  percentile: number;
  message: string;
}

export interface GameState {
  phase: GamePhase;
  cases: CaseState[];
  playerCaseId: number | null;
  roundIndex: number;
  casesOpenedThisRound: number;
  casesToOpenThisRound: number;
  /** Prize ids still sealed inside unopened cases (including the player's). */
  remainingPrizeIds: string[];
  eliminatedPrizeIds: string[];
  lastReveal: RevealInfo | null;
  currentOffer: Offer | null;
  offers: Offer[];
  result: GameResult | null;
  /** Headline instruction shown to the player, also announced to screen readers. */
  message: string;
  /** Set when two cases remain and a swap is on the table. */
  finalCandidateId: number | null;
  swapped: boolean;
  startedAt: number | null;
}

export type GameEvent =
  | { type: 'game:start' }
  | { type: 'case:pick-own'; caseId: number }
  | { type: 'case:open'; caseId: number; prize: Prize; isBig: boolean }
  | { type: 'prize:eliminate'; prizeId: string }
  | { type: 'round:start'; round: number; casesToOpen: number }
  | { type: 'banker:calling' }
  | { type: 'banker:offer'; offer: Offer }
  | { type: 'player:deal'; offer: Offer }
  | { type: 'player:no-deal'; offer: Offer }
  | { type: 'final:two'; caseIds: number[] }
  | { type: 'final:choice'; swapped: boolean }
  | { type: 'game:end'; result: GameResult };

export type GameEventType = GameEvent['type'];
