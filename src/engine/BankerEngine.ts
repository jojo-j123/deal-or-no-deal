import type { BankerConfig, BundleItem, Offer, ValueFormat } from './types.ts';
import { calculateOffer } from './OfferCalculator.ts';
import type { Rng } from './rng.ts';
import { uid } from './rng.ts';
import { formatValue, template } from './format.ts';

export interface OfferRequest {
  remainingValues: number[];
  progress: number;
  round: number;
  previousOffers: Offer[];
  previousAverage?: number;
  lines: string[];
}

/**
 * Wraps the offer maths with presentation: dialogue, and — for games whose
 * prizes are not money — a bundle of items worth roughly the offer.
 */
export class BankerEngine {
  private readonly config: BankerConfig;
  private readonly format: ValueFormat;
  private readonly rng: Rng;

  constructor(config: BankerConfig, format: ValueFormat, rng: Rng) {
    this.config = config;
    this.format = format;
    this.rng = rng;
  }

  makeOffer(request: OfferRequest): Offer {
    const previous = request.previousOffers[request.previousOffers.length - 1];
    const breakdown = calculateOffer({
      remainingValues: request.remainingValues,
      progress: request.progress,
      previousOffer: previous?.value,
      previousAverage: request.previousAverage,
      banker: this.config,
      random: () => this.rng.next(),
    });

    const bundle =
      this.config.offerPresentation === 'bundle'
        ? composeBundle(breakdown.final, this.config.bundleCatalog)
        : [];

    const lineSource = request.lines.length > 0 ? request.lines : ['{banker} is on the phone.'];
    const line = template(this.rng.pick(lineSource), {
      banker: this.config.name,
      round: request.round,
      offer: formatValue(breakdown.final, this.format),
      average: formatValue(breakdown.average, this.format),
      cases: breakdown.remainingCases,
    });

    return {
      id: uid('offer'),
      round: request.round,
      value: breakdown.final,
      bundle,
      breakdown,
      line,
      accepted: null,
    };
  }

  /** Human-readable summary of what the offer is made of. */
  describeBundle(bundle: BundleItem[]): string {
    return bundle.map((item) => item.displayName).join(' + ');
  }
}

/**
 * Greedy fill: pick the largest affordable items until the budget is spent.
 * Always returns at least one item so the screen is never empty.
 */
export function composeBundle(
  budget: number,
  catalog: BundleItem[],
  maxItems = 3,
): BundleItem[] {
  if (catalog.length === 0 || budget <= 0) return [];
  const sorted = catalog.slice().sort((a, b) => b.value - a.value);
  const cheapest = sorted[sorted.length - 1];
  const picked: BundleItem[] = [];
  let remaining = budget;

  for (let i = 0; i < maxItems; i++) {
    const next = sorted.find((item) => item.value <= remaining);
    if (!next) break;
    picked.push(next);
    remaining -= next.value;
    if (remaining < cheapest.value * 0.5) break;
  }

  if (picked.length === 0) picked.push(cheapest);
  return picked;
}
