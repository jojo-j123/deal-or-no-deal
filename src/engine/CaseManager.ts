import type { CaseState, Prize } from './types.ts';
import type { Rng } from './rng.ts';

/**
 * Deals prizes into numbered cases and answers questions about what is still
 * in play. Knows nothing about rounds, offers or presentation.
 */
export class CaseManager {
  static deal(prizes: Prize[], rng: Rng): CaseState[] {
    const shuffled = rng.shuffle(prizes);
    return shuffled.map((prize, index) => ({
      id: index,
      number: index + 1,
      prizeId: prize.id,
      opened: false,
      isPlayerCase: false,
      openedInRound: null,
    }));
  }

  static unopened(cases: CaseState[]): CaseState[] {
    return cases.filter((c) => !c.opened);
  }

  /** Cases the player is allowed to open right now. */
  static selectable(cases: CaseState[]): CaseState[] {
    return cases.filter((c) => !c.opened && !c.isPlayerCase);
  }

  static remainingPrizeIds(cases: CaseState[]): string[] {
    return cases.filter((c) => !c.opened).map((c) => c.prizeId);
  }

  static eliminatedPrizeIds(cases: CaseState[]): string[] {
    return cases.filter((c) => c.opened).map((c) => c.prizeId);
  }

  static byId(cases: CaseState[], id: number): CaseState | undefined {
    return cases.find((c) => c.id === id);
  }
}
