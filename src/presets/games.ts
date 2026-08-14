import type { BundleItem, GameConfig, Prize } from '../engine/types.ts';
import { createConfig } from '../engine/ConfigManager.ts';
import { RoundManager } from '../engine/RoundManager.ts';
import { arcadeTheme, classicTheme, cloneTheme, luxuryTheme, neonTheme } from './themes.ts';

/**
 * Three demo games that share one engine.
 *
 * The point of the second and third is to prove the first is not special:
 * money is just a prize whose display name happens to be its own value.
 */

/* ------------------------------------------------------------ classic money */

const MONEY_VALUES = [
  0.01, 1, 5, 10, 25, 50, 75, 100, 200, 300, 400, 500, 750, 1000, 5000, 10000, 25000, 50000,
  75000, 100000, 200000, 300000, 400000, 500000, 750000, 1000000,
];

const moneyPrizes: Prize[] = MONEY_VALUES.map((value, index) => ({
  id: `cash-${index}`,
  name: String(value),
  // Empty display name: the board renders the formatted value instead, so the
  // currency lives in one place (valueFormat) rather than in 26 strings.
  displayName: '',
  estimatedValue: value,
  rarity: value >= 300000 ? 'legendary' : value >= 50000 ? 'epic' : value >= 1000 ? 'rare' : 'common',
}));

export const classicMoneyGame: GameConfig = createConfig({
  id: 'demo-classic-money',
  gameTitle: 'Deal or No Deal',
  description:
    'The classic board. 26 sealed cases, one fortune, and a Banker who would rather you took less.',
  mode: 'money',
  caseCount: 26,
  prizes: moneyPrizes,
  rounds: RoundManager.generate(26),
  theme: cloneTheme(classicTheme),
  banker: {
    name: 'The Banker',
    personality: 'showman',
    aggressiveness: 58,
    generosity: 42,
    risk: 50,
    variancePenalty: 65,
    jitter: 22,
    rounding: 'nice',
    offerPresentation: 'value',
    bundleCatalog: [],
    countdownSeconds: 0,
  },
  rules: {
    allowSwapAtEnd: true,
    showValuesOnBoard: false,
    bigPrizePercentile: 0.72,
    revealPlayerCaseAfterDeal: true,
  },
  valueFormat: {
    style: 'currency',
    currency: 'USD',
    locale: 'en-US',
    prefix: '',
    suffix: '',
    maximumFractionDigits: 2,
  },
  dialogue: {
    pickOwnCase: 'Pick the case you will keep to the very end.',
    roundStart: [
      'Round {round}. Open {count} cases.',
      '{count} cases to open. Make them count.',
      'Round {round} — {count} to go before the phone rings.',
    ],
    caseOpen: ['{count} more to open.', 'Keep going. {count} left this round.'],
    revealHigh: ['Ouch — {prize} is off the board.', 'That one stings. {prize} gone.'],
    revealLow: ['{prize}. Exactly what you wanted to lose.', 'Great open — {prize} eliminated.'],
    bankerCalling: ['{banker} is calling…', 'The phone rings. {banker} has been watching.'],
    offer: [
      '{banker} offers you {offer}.',
      '{banker} will buy your case for {offer}.',
      'The offer on the table: {offer}.',
    ],
    deal: ['DEAL. You leave with {offer}.', 'Sold to {banker} for {offer}.'],
    noDeal: ['NO DEAL! Back to the board.', 'You said no. The Banker is not pleased.'],
    finalTwo: 'Two cases left — yours (#{caseA}) and #{caseB}. Keep it, or swap?',
    victory: ['{prize}! What a way to finish.', 'You held your nerve and it paid: {prize}.'],
    loss: ['{prize}. The Banker is smiling somewhere.', 'It ends at {prize}. Brutal.'],
  },
});

/* ------------------------------------------------------- custom prize boxes */

interface ItemSpec {
  name: string;
  icon: string;
  value: number;
  rarity?: Prize['rarity'];
  description?: string;
}

const PRIZE_BOX_ITEMS: ItemSpec[] = [
  { name: 'Rubber Duck', icon: '🦆', value: 5, rarity: 'common', description: 'It squeaks. That is the whole feature list.' },
  { name: 'Pizza Night', icon: '🍕', value: 25, rarity: 'common' },
  { name: 'Cinema Tickets', icon: '🎟️', value: 60, rarity: 'common' },
  { name: 'Mystery Envelope', icon: '✉️', value: 120, rarity: 'common', description: 'Nobody has opened it. Not even us.' },
  { name: 'Wireless Earbuds', icon: '🎧', value: 180, rarity: 'common' },
  { name: 'Studio Headphones', icon: '🎚️', value: 400, rarity: 'uncommon' },
  { name: 'Espresso Machine', icon: '☕', value: 700, rarity: 'uncommon' },
  { name: 'Camera Drone', icon: '🚁', value: 1200, rarity: 'uncommon' },
  { name: 'Flagship Phone', icon: '📱', value: 1600, rarity: 'uncommon' },
  { name: 'Gaming Console', icon: '🎮', value: 2400, rarity: 'rare' },
  { name: 'Gaming PC', icon: '🖥️', value: 3800, rarity: 'rare' },
  { name: 'Home Cinema', icon: '📽️', value: 6000, rarity: 'rare' },
  { name: 'Luxury Watch', icon: '⌚', value: 9000, rarity: 'rare' },
  { name: 'Dream Vacation', icon: '🏝️', value: 15000, rarity: 'epic' },
  { name: 'Recording Studio', icon: '🎛️', value: 25000, rarity: 'epic' },
  { name: 'Vintage Motorcycle', icon: '🏍️', value: 40000, rarity: 'epic' },
  { name: 'Sports Car', icon: '🏎️', value: 75000, rarity: 'legendary' },
  { name: 'Private Island Week', icon: '🛥️', value: 150000, rarity: 'legendary' },
  { name: 'Dream House', icon: '🏡', value: 400000, rarity: 'legendary' },
  { name: 'The Vault', icon: '💎', value: 900000, rarity: 'legendary', description: 'Whatever is inside, it is insured.' },
];

const bundleCatalog: BundleItem[] = [
  { id: 'b-giftcard', displayName: 'Gift Card', value: 150, icon: '🎁' },
  { id: 'b-speaker', displayName: 'Smart Speaker', value: 300, icon: '🔊' },
  { id: 'b-tablet', displayName: 'Tablet', value: 800, icon: '📱' },
  { id: 'b-bike', displayName: 'Electric Bike', value: 2500, icon: '🚲' },
  { id: 'b-laptop', displayName: 'Gaming Laptop', value: 4000, icon: '💻' },
  { id: 'b-watch', displayName: 'Designer Watch', value: 9000, icon: '⌚' },
  { id: 'b-vacation', displayName: 'Vacation Package', value: 18000, icon: '✈️' },
  { id: 'b-studio', displayName: 'Home Studio', value: 30000, icon: '🎛️' },
  { id: 'b-car', displayName: 'Convertible', value: 70000, icon: '🚗' },
  { id: 'b-loft', displayName: 'City Loft', value: 320000, icon: '🏙️' },
];

export const prizeBoxGame: GameConfig = createConfig({
  id: 'demo-prize-box',
  gameTitle: 'Ultimate Prize Box',
  description:
    'Same engine, no money. Twenty sealed boxes hold real things — and the Banker pays in things too.',
  mode: 'custom',
  caseCount: 20,
  prizes: PRIZE_BOX_ITEMS.map((item, index) => ({
    id: `box-${index}`,
    name: item.name,
    displayName: item.name,
    estimatedValue: item.value,
    icon: item.icon,
    rarity: item.rarity,
    description: item.description,
  })),
  rounds: RoundManager.generate(20),
  theme: cloneTheme(neonTheme),
  banker: {
    name: 'The Broker',
    personality: 'chaotic',
    aggressiveness: 50,
    generosity: 52,
    risk: 58,
    variancePenalty: 55,
    jitter: 35,
    rounding: 'nice',
    offerPresentation: 'bundle',
    bundleCatalog,
    countdownSeconds: 15,
  },
  rules: {
    allowSwapAtEnd: true,
    showValuesOnBoard: true,
    bigPrizePercentile: 0.7,
    revealPlayerCaseAfterDeal: true,
  },
  valueFormat: {
    style: 'compact',
    currency: 'USD',
    locale: 'en-US',
    prefix: '≈ $',
    suffix: '',
    maximumFractionDigits: 1,
  },
  dialogue: {
    pickOwnCase: 'Choose the box you will keep until the very end.',
    roundStart: ['Round {round} — open {count} boxes.', '{count} boxes. Pick your victims.'],
    caseOpen: ['{count} more this round.', '{count} to go.'],
    revealHigh: ['No! {prize} is gone.', '{prize} — that was worth keeping.'],
    revealLow: ['{prize}. Good riddance.', 'Nobody wanted {prize} anyway.'],
    bankerCalling: ['{banker} wants to trade…', '{banker} is on the line with an offer.'],
    offer: ['{banker} wants to buy your box for this:', '{banker} puts this on the table:'],
    deal: ['DEAL! You are walking out with {offer}.', 'Traded. {offer} is yours.'],
    noDeal: ['NO DEAL! The boxes stay sealed.', 'You keep your box. {banker} hangs up.'],
    finalTwo: 'Two boxes left — yours (#{caseA}) and #{caseB}. Keep it, or swap?',
    victory: ['{prize}! Nobody saw that coming.', 'You walk out with {prize}.'],
    loss: ['{prize}. Well… it is something.', 'You leave with {prize}. The Broker is delighted.'],
  },
});

/* ------------------------------------------------------------- fantasy loot */

const HOARD_ITEMS: ItemSpec[] = [
  { name: 'Rusted Dagger', icon: '🗡️', value: 5, rarity: 'common' },
  { name: 'Healing Draught', icon: '🧪', value: 30, rarity: 'common' },
  { name: 'Silver Signet', icon: '💍', value: 120, rarity: 'common' },
  { name: 'Elven Cloak', icon: '🧥', value: 450, rarity: 'uncommon' },
  { name: 'Dwarven Axe', icon: '🪓', value: 900, rarity: 'uncommon' },
  { name: 'Grimoire of Ash', icon: '📕', value: 2000, rarity: 'rare' },
  { name: 'Phoenix Feather', icon: '🪶', value: 5000, rarity: 'rare' },
  { name: 'Crown of Thorns', icon: '👑', value: 12000, rarity: 'epic' },
  { name: 'Dragon Egg', icon: '🥚', value: 30000, rarity: 'epic' },
  { name: 'Staff of Storms', icon: '🔱', value: 60000, rarity: 'legendary' },
  { name: 'The Wyrm Hoard', icon: '🐉', value: 150000, rarity: 'legendary' },
  { name: 'Immortality', icon: '⏳', value: 500000, rarity: 'legendary' },
];

export const dragonHoardGame: GameConfig = createConfig({
  id: 'demo-dragon-hoard',
  gameTitle: "Dragon's Hoard",
  description:
    'Twelve chests, one hoard, and a goblin merchant who counts in gold rather than dollars.',
  mode: 'custom',
  caseCount: 12,
  prizes: HOARD_ITEMS.map((item, index) => ({
    id: `hoard-${index}`,
    name: item.name,
    displayName: item.name,
    estimatedValue: item.value,
    icon: item.icon,
    rarity: item.rarity,
  })),
  rounds: RoundManager.generate(12),
  theme: {
    ...cloneTheme(luxuryTheme),
    id: 'hoard',
    name: 'Hoard',
    logo: { subtitle: 'Twelve Chests. One Hoard.' },
    banker: { emoji: '👺' },
  },
  banker: {
    name: 'Grix the Broker',
    personality: 'ruthless',
    aggressiveness: 70,
    generosity: 35,
    risk: 45,
    variancePenalty: 70,
    jitter: 30,
    rounding: 'nice',
    offerPresentation: 'value',
    bundleCatalog: [],
    countdownSeconds: 20,
  },
  rules: {
    allowSwapAtEnd: true,
    showValuesOnBoard: true,
    bigPrizePercentile: 0.7,
    revealPlayerCaseAfterDeal: true,
  },
  valueFormat: {
    style: 'number',
    currency: 'USD',
    locale: 'en-US',
    prefix: '',
    suffix: ' gold',
    maximumFractionDigits: 0,
  },
  dialogue: {
    pickOwnCase: 'Choose the chest you will carry out of the lair.',
    roundStart: ['Round {round}. Break the seals on {count} chests.', 'Open {count} chests, mortal.'],
    caseOpen: ['{count} chests remain this round.', 'Keep opening. {count} left.'],
    revealHigh: ['{prize} — lost to the dark.', 'The hoard weeps: {prize} is gone.'],
    revealLow: ['{prize}. Worthless. Good.', 'Only {prize}. Fortune favours you.'],
    bankerCalling: ['{banker} shuffles out of the shadows…', '{banker} clears his throat.'],
    offer: ['{banker} bids {offer} for your chest.', '“{offer}. Final word.” — {banker}'],
    deal: ['DEAL. {offer} weighs down your pack.', 'You take {offer} and walk.'],
    noDeal: ['NO DEAL! {banker} spits.', 'The chest stays yours.'],
    finalTwo: 'Two chests remain — yours (#{caseA}) and #{caseB}. Keep, or swap?',
    victory: ['{prize}! The lair is yours.', 'You leave carrying {prize}.'],
    loss: ['{prize}. The dragon laughs.', 'All that for {prize}.'],
  },
});

/* --------------------------------------------------------------- blank slate */

export function createBlankGame(caseCount = 12): GameConfig {
  return createConfig({
    gameTitle: 'My Custom Game',
    description: 'Built with the game creator.',
    mode: 'custom',
    caseCount,
    prizes: Array.from({ length: caseCount }, (_, index) => ({
      id: `prize-${index}`,
      name: `Prize ${index + 1}`,
      displayName: `Prize ${index + 1}`,
      estimatedValue: Math.round(10 * Math.pow(2.4, index)),
      icon: '🎁',
    })),
    rounds: RoundManager.generate(caseCount),
    theme: cloneTheme(arcadeTheme),
    rules: {
      allowSwapAtEnd: true,
      showValuesOnBoard: true,
      bigPrizePercentile: 0.72,
      revealPlayerCaseAfterDeal: true,
    },
  });
}

export const demoGames: GameConfig[] = [classicMoneyGame, prizeBoxGame, dragonHoardGame];

export function getDemoGame(id: string): GameConfig | null {
  return demoGames.find((game) => game.id === id) ?? null;
}

/** Deep clone so a play session can never mutate a shared preset. */
export function cloneGame(config: GameConfig): GameConfig {
  return JSON.parse(JSON.stringify(config)) as GameConfig;
}
