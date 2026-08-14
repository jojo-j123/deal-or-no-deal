import type {
  CaseState,
  GameConfig,
  GameEvent,
  GameResult,
  GameState,
  Offer,
  Prize,
  RevealInfo,
} from './types.ts';
import { CaseManager } from './CaseManager.ts';
import { PrizeManager } from './PrizeManager.ts';
import { RoundManager } from './RoundManager.ts';
import { BankerEngine } from './BankerEngine.ts';
import { createRng, uid } from './rng.ts';
import type { Rng } from './rng.ts';
import { formatValue, template } from './format.ts';

type StateListener = (state: GameState) => void;
type EventListener = (event: GameEvent) => void;

export interface GameEngineOptions {
  seed?: number;
}

/**
 * The whole game as a state machine. No DOM, no React, no timers —
 * the presentation layer decides how long a reveal lingers, the engine only
 * decides what is true.
 */
export class GameEngine {
  readonly config: GameConfig;
  readonly prizes: PrizeManager;

  private rng: Rng;
  private banker: BankerEngine;
  private state: GameState;
  private readonly stateListeners = new Set<StateListener>();
  private readonly eventListeners = new Set<EventListener>();
  private readonly seed?: number;

  constructor(config: GameConfig, options: GameEngineOptions = {}) {
    this.config = config;
    this.seed = options.seed;
    this.rng = createRng(options.seed);
    this.prizes = new PrizeManager(config.prizes, config.valueFormat, config.rules.bigPrizePercentile);
    this.banker = new BankerEngine(config.banker, config.valueFormat, this.rng);
    this.state = this.initialState();
  }

  /* ---------------------------------------------------------------- setup */

  private initialState(): GameState {
    return {
      phase: 'setup',
      cases: [],
      playerCaseId: null,
      roundIndex: 0,
      casesOpenedThisRound: 0,
      casesToOpenThisRound: 0,
      remainingPrizeIds: this.config.prizes.map((p) => p.id),
      eliminatedPrizeIds: [],
      lastReveal: null,
      currentOffer: null,
      offers: [],
      result: null,
      message: '',
      finalCandidateId: null,
      swapped: false,
      startedAt: null,
    };
  }

  /* ------------------------------------------------------------ observers */

  subscribe(listener: StateListener): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  onEvent(listener: EventListener): () => void {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  }

  getState(): GameState {
    return this.state;
  }

  private patch(changes: Partial<GameState>): void {
    this.state = { ...this.state, ...changes };
    for (const listener of this.stateListeners) listener(this.state);
  }

  private emit(event: GameEvent): void {
    for (const listener of this.eventListeners) listener(event);
  }

  /* -------------------------------------------------------------- helpers */

  private prizeOfCase(caseId: number): Prize {
    const target = CaseManager.byId(this.state.cases, caseId);
    if (!target) throw new Error(`Unknown case: ${caseId}`);
    return this.prizes.require(target.prizeId);
  }

  private line(pool: string[], tokens: Record<string, string | number>, fallback = ''): string {
    if (!pool || pool.length === 0) return fallback;
    return template(this.rng.pick(pool), tokens);
  }

  private baseTokens(): Record<string, string | number> {
    const unopened = CaseManager.unopened(this.state.cases).length;
    return {
      banker: this.config.banker.name,
      game: this.config.gameTitle,
      round: this.state.roundIndex + 1,
      remaining: unopened,
      count: Math.max(0, this.state.casesToOpenThisRound - this.state.casesOpenedThisRound),
    };
  }

  /** Values still sealed in unopened cases, including the player's own. */
  private remainingValues(): number[] {
    return CaseManager.unopened(this.state.cases).map((c) => this.prizes.valueOf(c.prizeId));
  }

  private averageRemaining(): number {
    const values = this.remainingValues();
    if (values.length === 0) return 0;
    return values.reduce((s, v) => s + v, 0) / values.length;
  }

  /* -------------------------------------------------------------- actions */

  start(): void {
    this.rng = createRng(this.seed);
    this.banker = new BankerEngine(this.config.banker, this.config.valueFormat, this.rng);
    const cases = CaseManager.deal(this.config.prizes, this.rng);
    this.state = {
      ...this.initialState(),
      cases,
      phase: 'pick-own',
      startedAt: Date.now(),
      message: this.config.dialogue.pickOwnCase,
    };
    for (const listener of this.stateListeners) listener(this.state);
    this.emit({ type: 'game:start' });
  }

  pickOwnCase(caseId: number): void {
    if (this.state.phase !== 'pick-own') return;
    const cases: CaseState[] = this.state.cases.map((c) =>
      c.id === caseId ? { ...c, isPlayerCase: true } : c,
    );
    const firstRound = this.config.rounds[0];
    this.patch({
      cases,
      playerCaseId: caseId,
      phase: 'opening',
      roundIndex: 0,
      casesOpenedThisRound: 0,
      casesToOpenThisRound: firstRound ? firstRound.casesToOpen : 0,
    });
    this.emit({ type: 'case:pick-own', caseId });
    this.announceRound();
  }

  private announceRound(): void {
    const round = this.config.rounds[this.state.roundIndex];
    if (!round) return;
    this.patch({
      message: this.line(this.config.dialogue.roundStart, {
        ...this.baseTokens(),
        count: round.casesToOpen,
      }),
    });
    this.emit({ type: 'round:start', round: this.state.roundIndex + 1, casesToOpen: round.casesToOpen });
  }

  canOpen(caseId: number): boolean {
    if (this.state.phase !== 'opening') return false;
    const target = CaseManager.byId(this.state.cases, caseId);
    return Boolean(target && !target.opened && !target.isPlayerCase);
  }

  openCase(caseId: number): void {
    if (!this.canOpen(caseId)) return;
    const target = CaseManager.byId(this.state.cases, caseId)!;
    const prize = this.prizes.require(target.prizeId);
    const isBig = this.prizes.isBig(prize);
    const cases = this.state.cases.map((c) =>
      c.id === caseId ? { ...c, opened: true, openedInRound: this.state.roundIndex } : c,
    );

    const reveal: RevealInfo = {
      caseId,
      caseNumber: target.number,
      prize,
      isBig,
      line: this.line(
        isBig ? this.config.dialogue.revealHigh : this.config.dialogue.revealLow,
        { ...this.baseTokens(), prize: this.prizes.label(prize), case: target.number },
      ),
    };

    this.patch({
      cases,
      phase: 'reveal',
      lastReveal: reveal,
      remainingPrizeIds: CaseManager.remainingPrizeIds(cases),
      eliminatedPrizeIds: CaseManager.eliminatedPrizeIds(cases),
    });
    this.emit({ type: 'case:open', caseId, prize, isBig });
    this.emit({ type: 'prize:eliminate', prizeId: prize.id });
  }

  /** Called by the UI once the reveal animation has finished. */
  dismissReveal(): void {
    if (this.state.phase !== 'reveal') return;
    const openedThisRound = this.state.casesOpenedThisRound + 1;
    const unopened = CaseManager.unopened(this.state.cases).length;

    if (unopened <= 2) {
      this.patch({ casesOpenedThisRound: openedThisRound, lastReveal: null });
      this.endRound(true);
      return;
    }

    if (openedThisRound >= this.state.casesToOpenThisRound) {
      this.patch({ casesOpenedThisRound: openedThisRound, lastReveal: null });
      this.endRound(false);
      return;
    }

    this.patch({
      casesOpenedThisRound: openedThisRound,
      phase: 'opening',
      lastReveal: null,
      message: this.line(this.config.dialogue.caseOpen, this.baseTokens()),
    });
  }

  private endRound(atFinalTwo: boolean): void {
    const round = this.config.rounds[this.state.roundIndex];
    const wantsOffer = round ? round.offerAfter : true;

    if (wantsOffer) {
      this.patch({
        phase: 'banker-calling',
        message: this.line(this.config.dialogue.bankerCalling, this.baseTokens(), ''),
      });
      this.emit({ type: 'banker:calling' });
      return;
    }
    if (atFinalTwo) this.beginFinal();
    else this.advanceRound();
  }

  /** The UI calls this after the "phone ringing" beat to reveal the number. */
  revealOffer(): void {
    if (this.state.phase !== 'banker-calling') return;
    const offer = this.banker.makeOffer({
      remainingValues: this.remainingValues(),
      progress: RoundManager.progress(
        this.config.rounds,
        this.state.roundIndex,
        this.state.casesOpenedThisRound,
      ),
      round: this.state.roundIndex + 1,
      previousOffers: this.state.offers,
      previousAverage: this.state.offers[this.state.offers.length - 1]?.breakdown.average,
      lines: this.config.dialogue.offer,
    });
    this.patch({ phase: 'offer', currentOffer: offer, message: offer.line });
    this.emit({ type: 'banker:offer', offer });
  }

  acceptDeal(): void {
    const offer = this.state.currentOffer;
    if (this.state.phase !== 'offer' || !offer) return;
    const settled: Offer = { ...offer, accepted: true };
    this.patch({
      currentOffer: settled,
      offers: [...this.state.offers, settled],
    });
    this.emit({ type: 'player:deal', offer: settled });
    this.finishWithDeal(settled);
  }

  declineDeal(): void {
    const offer = this.state.currentOffer;
    if (this.state.phase !== 'offer' || !offer) return;
    const settled: Offer = { ...offer, accepted: false };
    const unopened = CaseManager.unopened(this.state.cases).length;
    this.patch({
      currentOffer: null,
      offers: [...this.state.offers, settled],
      message: this.line(this.config.dialogue.noDeal, this.baseTokens()),
    });
    this.emit({ type: 'player:no-deal', offer: settled });
    if (unopened <= 2) this.beginFinal();
    else this.advanceRound();
  }

  private advanceRound(): void {
    const nextIndex = this.state.roundIndex + 1;
    const unopened = CaseManager.unopened(this.state.cases).length;

    if (unopened <= 2) {
      this.beginFinal();
      return;
    }
    if (nextIndex >= this.config.rounds.length) {
      // Defensive: a malformed schedule shouldn't strand the player. Keep
      // opening one case at a time until the final two remain.
      this.patch({
        roundIndex: nextIndex,
        casesOpenedThisRound: 0,
        casesToOpenThisRound: 1,
        phase: 'opening',
        message: this.line(this.config.dialogue.roundStart, { ...this.baseTokens(), count: 1 }),
      });
      return;
    }
    this.patch({
      roundIndex: nextIndex,
      casesOpenedThisRound: 0,
      casesToOpenThisRound: this.config.rounds[nextIndex].casesToOpen,
      phase: 'opening',
    });
    this.announceRound();
  }

  private beginFinal(): void {
    const unopened = CaseManager.unopened(this.state.cases);
    const other = unopened.find((c) => !c.isPlayerCase);

    if (!other || !this.config.rules.allowSwapAtEnd) {
      this.resolveFinalCase(false);
      return;
    }
    this.patch({
      phase: 'final-choice',
      finalCandidateId: other.id,
      currentOffer: null,
      message: template(this.config.dialogue.finalTwo, {
        ...this.baseTokens(),
        caseA: CaseManager.byId(this.state.cases, this.state.playerCaseId ?? 0)?.number ?? '?',
        caseB: other.number,
      }),
    });
    this.emit({
      type: 'final:two',
      caseIds: unopened.map((c) => c.id),
    });
  }

  chooseFinal(choice: 'keep' | 'swap'): void {
    if (this.state.phase !== 'final-choice') return;
    this.resolveFinalCase(choice === 'swap');
  }

  private resolveFinalCase(swap: boolean): void {
    const playerCaseId = this.state.playerCaseId;
    if (playerCaseId === null) return;
    const other = CaseManager.unopened(this.state.cases).find((c) => !c.isPlayerCase);
    const finalCaseId = swap && other ? other.id : playerCaseId;

    const cases = this.state.cases.map((c) => ({ ...c, opened: true }));
    const wonPrize = this.prizeOfCase(finalCaseId);
    const ownPrize = this.prizeOfCase(playerCaseId);
    const value = wonPrize.estimatedValue ?? 0;
    const percentile = this.prizes.percentileOf(value);

    const result: GameResult = {
      outcome: 'final-case',
      wonPrize,
      wonValue: wonPrize.estimatedValue ?? null,
      wonLabel: this.prizes.label(wonPrize),
      playerPrize: swap ? ownPrize : wonPrize,
      betterThanCase: swap ? value >= (ownPrize.estimatedValue ?? 0) : null,
      percentile,
      message: this.line(
        percentile >= 0.5 ? this.config.dialogue.victory : this.config.dialogue.loss,
        { ...this.baseTokens(), prize: this.prizes.label(wonPrize), value: this.prizes.valueLabel(wonPrize) },
      ),
    };

    this.patch({
      cases,
      swapped: swap,
      playerCaseId: finalCaseId,
      phase: 'ended',
      result,
      lastReveal: null,
      message: result.message,
      remainingPrizeIds: [],
      eliminatedPrizeIds: cases.map((c) => c.prizeId),
    });
    this.emit({ type: 'final:choice', swapped: swap });
    this.emit({ type: 'game:end', result });
  }

  private finishWithDeal(offer: Offer): void {
    const playerCaseId = this.state.playerCaseId;
    if (playerCaseId === null) return;
    const playerPrize = this.prizeOfCase(playerCaseId);
    const cases = this.config.rules.revealPlayerCaseAfterDeal
      ? this.state.cases.map((c) => ({ ...c, opened: true }))
      : this.state.cases;

    const wonLabel =
      this.config.banker.offerPresentation === 'bundle' && offer.bundle.length > 0
        ? offer.bundle.map((b) => b.displayName).join(' + ')
        : formatValue(offer.value, this.config.valueFormat);

    const betterThanCase = offer.value >= (playerPrize.estimatedValue ?? 0);
    const result: GameResult = {
      outcome: 'deal',
      wonPrize: null,
      wonValue: offer.value,
      wonLabel,
      playerPrize,
      betterThanCase,
      percentile: this.prizes.percentileOf(offer.value),
      message: this.line(this.config.dialogue.deal, {
        ...this.baseTokens(),
        offer: wonLabel,
        prize: this.prizes.label(playerPrize),
      }),
    };

    this.patch({
      cases,
      phase: 'ended',
      result,
      message: result.message,
      remainingPrizeIds: [],
      eliminatedPrizeIds: cases.filter((c) => c.opened).map((c) => c.prizeId),
    });
    this.emit({ type: 'game:end', result });
  }

  restart(): void {
    this.start();
  }

  /* ------------------------------------------------------------ selectors */

  /** What the Banker would say the board is worth right now. */
  getAverageRemaining(): number {
    return this.averageRemaining();
  }

  getFormattedAverage(): string {
    return formatValue(this.averageRemaining(), this.config.valueFormat);
  }

  isPrizeEliminated(prizeId: string): boolean {
    return !this.state.remainingPrizeIds.includes(prizeId);
  }

  getCasesLeftInRound(): number {
    return Math.max(0, this.state.casesToOpenThisRound - this.state.casesOpenedThisRound);
  }

  static newId(): string {
    return uid('game');
  }
}
