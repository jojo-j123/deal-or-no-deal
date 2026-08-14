import type { BankerConfig, BankerPersonality, OfferBreakdown } from './types.ts';

export interface OfferInput {
  /** Estimated values still sealed in unopened cases (including the player's). */
  remainingValues: number[];
  /** 0..1 through the round schedule. */
  progress: number;
  /** Value of the previous offer, if the Banker has called before. */
  previousOffer?: number;
  /** Average of remaining values at the time of the previous offer. */
  previousAverage?: number;
  banker: BankerConfig;
  /** Injected so offers are reproducible in tests. */
  random?: () => number;
}

const PERSONALITY: Record<
  BankerPersonality,
  { base: number; earlyBias: number; lateBias: number; chaos: number }
> = {
  fair: { base: 1.0, earlyBias: 0, lateBias: 0, chaos: 0 },
  ruthless: { base: 0.82, earlyBias: -0.08, lateBias: -0.02, chaos: 0.02 },
  generous: { base: 1.14, earlyBias: 0.04, lateBias: 0.06, chaos: 0.02 },
  chaotic: { base: 0.98, earlyBias: 0, lateBias: 0, chaos: 0.28 },
  showman: { base: 0.95, earlyBias: -0.14, lateBias: 0.12, chaos: 0.06 },
};

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/**
 * Turns the state of the board into a number.
 *
 * The shape of the curve matters more than any single term: early offers are a
 * fraction of the average (the Banker is buying cheap while the board is wide),
 * and they converge on — occasionally exceed — the average as the spread
 * collapses. Every term is exposed on the breakdown so the creator UI can show
 * its work.
 */
export function calculateOffer(input: OfferInput): OfferBreakdown {
  const { banker } = input;
  const random = input.random ?? Math.random;
  const values = input.remainingValues.filter((v) => Number.isFinite(v));
  const count = values.length;

  if (count === 0) {
    return {
      average: 0, weighted: 0, highest: 0, lowest: 0, remainingCases: 0,
      roundFactor: 0, spreadPenalty: 1, personalityFactor: 1, jitterFactor: 1,
      raw: 0, final: 0,
    };
  }

  const sorted = values.slice().sort((a, b) => a - b);
  const lowest = sorted[0];
  const highest = sorted[sorted.length - 1];
  const average = sorted.reduce((s, v) => s + v, 0) / count;

  // --- Risk tilt: which end of the board does the Banker believe in? --------
  // risk 50 -> plain average, 100 -> weighted toward the top prizes, 0 -> the bottom.
  const alpha = (clamp(banker.risk, 0, 100) - 50) / 25; // -2 .. 2
  let weighted = average;
  if (count > 1 && alpha !== 0) {
    let num = 0;
    let den = 0;
    for (let i = 0; i < count; i++) {
      const rank = (i + 1) / count; // 0..1, ascending
      // alpha > 0 leans on the top of the board, alpha < 0 on the bottom.
      const w = Math.pow(alpha > 0 ? rank : 1 + 1 / count - rank, Math.abs(alpha));
      num += sorted[i] * w;
      den += w;
    }
    weighted = den > 0 ? num / den : average;
  }

  // --- Round curve: the Banker gets closer to fair value as the game tightens.
  const progress = clamp(input.progress, 0, 1);
  const nearEnd = count <= 2 ? 1 : count <= 3 ? 0.9 : 0;
  const roundFactor = clamp(
    Math.max(0.26 + 0.82 * Math.pow(progress, 1.32), nearEnd * 0.98),
    0.15,
    1.08,
  );

  // --- Spread penalty: a wide board is risky to buy out, so the offer dips. --
  const spread = highest > 0 ? clamp((highest - lowest) / highest, 0, 1) : 0;
  const spreadPenalty = 1 - (clamp(banker.variancePenalty, 0, 100) / 100) * 0.34 * spread * (1 - progress * 0.7);

  // --- Personality, aggressiveness and generosity ---------------------------
  const persona = PERSONALITY[banker.personality] ?? PERSONALITY.fair;
  const bias = progress < 0.5 ? persona.earlyBias : persona.lateBias;
  const temperament = ((clamp(banker.generosity, 0, 100) - clamp(banker.aggressiveness, 0, 100)) / 100) * 0.3;
  const chaos = persona.chaos > 0 ? (random() - 0.5) * 2 * persona.chaos : 0;
  const personalityFactor = clamp(persona.base + bias + temperament + chaos, 0.35, 1.75);

  // --- Jitter ---------------------------------------------------------------
  const jitterFactor = 1 + (clamp(banker.jitter, 0, 100) / 100) * (random() - 0.5) * 0.24;

  const raw = weighted * roundFactor * spreadPenalty * personalityFactor * jitterFactor;

  // --- Sanity rails ---------------------------------------------------------
  let final = raw;
  if (count > 1) {
    // Never insult the player below the worst case still in play, and never
    // hand them more than the best one.
    final = clamp(final, Math.min(lowest * 1.05, average), highest * 0.99);
  } else {
    final = clamp(final, lowest * 0.4, highest);
  }
  // If the board improved since the last call, the offer shouldn't collapse.
  if (
    input.previousOffer !== undefined &&
    input.previousAverage !== undefined &&
    average >= input.previousAverage
  ) {
    final = Math.max(final, input.previousOffer * 0.9);
  }

  final = roundOffer(final, banker.rounding);

  return {
    average, weighted, highest, lowest,
    remainingCases: count,
    roundFactor, spreadPenalty, personalityFactor, jitterFactor,
    raw, final,
  };
}

/** Bankers deal in round numbers. */
export function roundOffer(value: number, mode: BankerConfig['rounding']): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  if (mode === 'none') return value;
  if (mode === 'whole') return Math.round(value);
  const magnitude = Math.floor(Math.log10(value));
  const step = Math.max(1, Math.pow(10, magnitude - 1));
  return Math.round(value / step) * step;
}
