import type { GameConfig, Prize } from '../../engine/types.ts';
import { RoundManager } from '../../engine/RoundManager.ts';
import { createPrize } from '../../engine/ConfigManager.ts';

/**
 * Changing the case count has to keep the prize list and round schedule in
 * step, otherwise the game is instantly unplayable.
 */
export function applyCaseCount(config: GameConfig, caseCount: number): GameConfig {
  const prizes = resizePrizes(config.prizes, caseCount);
  return {
    ...config,
    caseCount,
    prizes,
    rounds: RoundManager.generate(caseCount),
  };
}

export function resizePrizes(prizes: Prize[], count: number): Prize[] {
  if (prizes.length === count) return prizes;
  if (prizes.length > count) return prizes.slice(0, count);

  const next = prizes.slice();
  // New prizes continue the existing value ladder rather than landing on zero.
  const values = prizes
    .map((p) => p.estimatedValue ?? 0)
    .filter((v) => v > 0)
    .sort((a, b) => a - b);
  const top = values[values.length - 1] ?? 100;
  const growth = values.length > 1 ? Math.max(1.5, top / (values[values.length - 2] || 1)) : 2.5;

  for (let i = next.length; i < count; i++) {
    const step = i - prizes.length + 1;
    next.push(
      createPrize({
        name: `Prize ${i + 1}`,
        displayName: `Prize ${i + 1}`,
        estimatedValue: Math.round(top * Math.pow(growth, step)),
        icon: '🎁',
      }),
    );
  }
  return next;
}

/** A classic doubling money ladder for any number of cases. */
export function generateMoneyLadder(count: number): Prize[] {
  const min = 1;
  const max = 1_000_000;
  const ratio = Math.pow(max / min, 1 / Math.max(1, count - 1));
  return Array.from({ length: count }, (_, index) => {
    const raw = min * Math.pow(ratio, index);
    const value = index === 0 ? min : index === count - 1 ? max : niceRound(raw);
    return createPrize({
      name: String(value),
      displayName: '',
      estimatedValue: value,
      rarity: index >= count - 3 ? 'legendary' : index >= count - 7 ? 'epic' : index >= count / 2 ? 'rare' : 'common',
    });
  });
}

function niceRound(value: number): number {
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const normalised = value / magnitude;
  const step = normalised < 1.5 ? 1 : normalised < 3.5 ? 2.5 : normalised < 7.5 ? 5 : 10;
  return Math.round(step * magnitude);
}

export function sortPrizesByValue(prizes: Prize[]): Prize[] {
  return prizes.slice().sort((a, b) => (a.estimatedValue ?? 0) - (b.estimatedValue ?? 0));
}

export function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (to < 0 || to >= items.length) return items;
  const next = items.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}
