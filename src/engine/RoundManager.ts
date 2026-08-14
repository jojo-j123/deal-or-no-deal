import type { RoundPlan } from './types.ts';
import { uid } from './rng.ts';

export interface RoundValidation {
  valid: boolean;
  totalToOpen: number;
  required: number;
  issues: { level: 'error' | 'warning'; message: string }[];
}

/**
 * Round scheduling.
 *
 * The player keeps one case for the whole game and the last remaining case is
 * resolved by the final sequence, so the rounds must open exactly
 * `caseCount - 2` cases between them.
 */
export class RoundManager {
  /**
   * Builds a show-style descending schedule for any case count:
   * 26 cases -> 6,5,4,3,2,1,1,1,1
   */
  static generate(caseCount: number, offerAfterEvery = true): RoundPlan[] {
    const required = Math.max(0, caseCount - 2);
    if (required === 0) return [];

    let k = 1;
    while (((k + 1) * (k + 2)) / 2 <= required) k += 1;

    const counts: number[] = [];
    for (let n = k; n >= 1; n--) counts.push(n);
    let remainder = required - (k * (k + 1)) / 2;
    while (remainder > 0) {
      counts.push(1);
      remainder -= 1;
    }

    return counts.map((casesToOpen, index) => ({
      id: uid('round'),
      casesToOpen,
      offerAfter: offerAfterEvery ? true : index < counts.length - 1,
    }));
  }

  static validate(rounds: RoundPlan[], caseCount: number): RoundValidation {
    const required = Math.max(0, caseCount - 2);
    const totalToOpen = rounds.reduce((sum, r) => sum + Math.max(0, r.casesToOpen), 0);
    const issues: RoundValidation['issues'] = [];

    if (rounds.length === 0) {
      issues.push({ level: 'error', message: 'Add at least one round.' });
    }
    if (rounds.some((r) => r.casesToOpen < 1)) {
      issues.push({ level: 'error', message: 'Every round must open at least one case.' });
    }
    if (totalToOpen !== required) {
      const diff = required - totalToOpen;
      issues.push({
        level: 'error',
        message:
          diff > 0
            ? `Rounds open ${totalToOpen} of ${required} cases — ${diff} too few for ${caseCount} cases.`
            : `Rounds open ${totalToOpen} of ${required} cases — ${-diff} too many for ${caseCount} cases.`,
      });
    }
    if (rounds.length > 0 && !rounds.some((r) => r.offerAfter)) {
      issues.push({
        level: 'warning',
        message: 'The Banker never calls. Enable an offer on at least one round.',
      });
    }
    if (rounds.length > 1 && rounds[0].casesToOpen < rounds[rounds.length - 1].casesToOpen) {
      issues.push({
        level: 'warning',
        message: 'Rounds usually open fewer cases as the game tightens.',
      });
    }

    return {
      valid: issues.every((i) => i.level !== 'error'),
      totalToOpen,
      required,
      issues,
    };
  }

  static totalCasesToOpen(rounds: RoundPlan[]): number {
    return rounds.reduce((sum, r) => sum + r.casesToOpen, 0);
  }

  /** 0..1 progress through the whole schedule, used by the offer curve. */
  static progress(rounds: RoundPlan[], roundIndex: number, openedThisRound: number): number {
    const total = RoundManager.totalCasesToOpen(rounds);
    if (total === 0) return 1;
    let opened = openedThisRound;
    for (let i = 0; i < roundIndex && i < rounds.length; i++) opened += rounds[i].casesToOpen;
    return Math.min(1, opened / total);
  }
}
