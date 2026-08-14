import type { Prize, ValueFormat } from './types.ts';
import { formatValue } from './format.ts';

/**
 * Owns the prize pool: lookup, ordering, value statistics and the notion of
 * what counts as a "big" prize for this particular game.
 */
export class PrizeManager {
  private readonly byId = new Map<string, Prize>();
  private readonly ordered: Prize[];
  private readonly valued: number[];
  private readonly format: ValueFormat;
  private readonly bigPercentile: number;

  constructor(prizes: Prize[], format: ValueFormat, bigPercentile = 0.75) {
    this.format = format;
    this.bigPercentile = bigPercentile;
    for (const prize of prizes) this.byId.set(prize.id, prize);
    // Board order: ascending by value, unknown values keep their authored order.
    this.ordered = prizes.slice().sort((a, b) => {
      const av = a.estimatedValue;
      const bv = b.estimatedValue;
      if (av === undefined && bv === undefined) return 0;
      if (av === undefined) return -1;
      if (bv === undefined) return 1;
      return av - bv;
    });
    this.valued = prizes
      .map((p) => p.estimatedValue)
      .filter((v): v is number => typeof v === 'number')
      .sort((a, b) => a - b);
  }

  get all(): Prize[] {
    return this.ordered;
  }

  get(id: string): Prize | undefined {
    return this.byId.get(id);
  }

  require(id: string): Prize {
    const prize = this.byId.get(id);
    if (!prize) throw new Error(`Unknown prize: ${id}`);
    return prize;
  }

  valueOf(id: string): number {
    return this.byId.get(id)?.estimatedValue ?? 0;
  }

  /** Board is split in two columns; the low half reads first. */
  get lowHalf(): Prize[] {
    return this.ordered.slice(0, Math.ceil(this.ordered.length / 2));
  }

  get highHalf(): Prize[] {
    return this.ordered.slice(Math.ceil(this.ordered.length / 2));
  }

  /** Threshold at/above which a reveal triggers the celebratory treatment. */
  get bigThreshold(): number {
    if (this.valued.length === 0) return Number.POSITIVE_INFINITY;
    const idx = Math.min(
      this.valued.length - 1,
      Math.floor(this.valued.length * this.bigPercentile),
    );
    return this.valued[idx];
  }

  isBig(prize: Prize): boolean {
    if (typeof prize.estimatedValue !== 'number') return prize.rarity === 'legendary' || prize.rarity === 'epic';
    return prize.estimatedValue >= this.bigThreshold;
  }

  /** 0 (worst prize in the game) .. 1 (best prize in the game). */
  percentileOf(value: number): number {
    if (this.valued.length < 2) return 1;
    const below = this.valued.filter((v) => v < value).length;
    return below / (this.valued.length - 1);
  }

  /**
   * A prize with no display name falls back to its formatted value, which is
   * what makes a pure money board possible without hardcoding a currency:
   * switch the game to EUR and every "$1,000" becomes "€1,000".
   */
  label(prize: Prize): string {
    if (prize.displayName && prize.displayName.trim()) return prize.displayName.trim();
    const formatted = formatValue(prize.estimatedValue, this.format);
    if (formatted && formatted !== '—') return formatted;
    return prize.name;
  }

  /** "Sports Car" or "$1,000" — the board never assumes money. */
  valueLabel(prize: Prize): string {
    return formatValue(prize.estimatedValue, this.format);
  }
}
