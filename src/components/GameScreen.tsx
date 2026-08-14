import { useEffect, useMemo } from 'react';
import type { GameConfig, Prize } from '../engine/types.ts';
import { useGameEngine } from '../react/useGameEngine.ts';
import { useSettings } from '../react/settings.tsx';
import { formatValue } from '../engine/format.ts';
import { CaseManager } from '../engine/CaseManager.ts';
import { Stage } from './Stage.tsx';
import { CaseGrid } from './CaseGrid.tsx';
import { CaseArt } from './CaseArt.tsx';
import { PrizeBoard } from './PrizeBoard.tsx';
import { RevealOverlay } from './RevealOverlay.tsx';
import { BankerCalling, OfferOverlay } from './BankerOverlay.tsx';
import { FinalChoice } from './FinalChoice.tsx';
import { ResultScreen } from './ResultScreen.tsx';
import { SoundToggle } from './Controls.tsx';

interface GameScreenProps {
  config: GameConfig;
  onExit: () => void;
  exitLabel?: string;
}

export function GameScreen({ config, onExit, exitLabel = 'Back to games' }: GameScreenProps) {
  const { settings } = useSettings();
  const game = useGameEngine(config);
  const { state, engine, effects } = game;

  const prizes = engine.prizes;
  const fmt = (value: number | undefined | null) => formatValue(value, config.valueFormat);

  const labelForPrize = (prize: Prize) => prizes.label(prize);
  const valueForPrize = (prize: Prize) => prizes.valueLabel(prize);
  const labelForId = (prizeId: string) => {
    const prize = prizes.get(prizeId);
    return prize ? prizes.label(prize) : '';
  };

  const playerCase = state.playerCaseId !== null
    ? CaseManager.byId(state.cases, state.playerCaseId)
    : undefined;
  const finalOther = state.finalCandidateId !== null
    ? CaseManager.byId(state.cases, state.finalCandidateId)
    : undefined;

  const casesLeft = CaseManager.unopened(state.cases).length;
  const roundNumber = Math.min(state.roundIndex + 1, config.rounds.length);
  const casesLeftInRound = engine.getCasesLeftInRound();

  // Mirrored onto the document so CSS and end-to-end tests can see the phase.
  useEffect(() => {
    document.documentElement.dataset.phase = state.phase;
    return () => {
      delete document.documentElement.dataset.phase;
    };
  }, [state.phase]);

  const bestOffer = useMemo(
    () => state.offers.reduce<number | null>((best, offer) => (best === null || offer.value > best ? offer.value : best), null),
    [state.offers],
  );

  const headline = useMemo(() => {
    switch (state.phase) {
      case 'pick-own':
        return { title: 'Choose your case', sub: config.dialogue.pickOwnCase };
      case 'opening':
        return {
          title: `Open ${casesLeftInRound} ${casesLeftInRound === 1 ? 'case' : 'cases'}`,
          sub: state.message,
        };
      case 'reveal':
        return { title: 'Opening…', sub: state.message };
      case 'banker-calling':
        return { title: 'The phone rings', sub: `${config.banker.name} has seen enough` };
      case 'offer':
        return { title: 'Deal or no deal?', sub: state.message };
      case 'final-choice':
        return { title: 'Final two', sub: 'Keep your case, or swap it' };
      case 'ended':
        return { title: 'Game over', sub: state.message };
      default:
        return { title: config.gameTitle, sub: config.description };
    }
  }, [state.phase, state.message, casesLeftInRound, config]);

  return (
    <Stage
      theme={config.theme}
      shake={effects.shake}
      burst={effects.burst}
      confetti={effects.confetti}
      reducedMotion={settings.reducedMotion}
    >
      <a className="skip-link" href="#case-grid">Skip to the cases</a>

      <header className="topbar">
        <div className="topbar__brand">
          {config.theme.logo.imageUrl ? (
            <img className="topbar__logo-img" src={config.theme.logo.imageUrl} alt={config.gameTitle} />
          ) : (
            <h1 className="topbar__logo display gold-text">
              {config.theme.logo.text || config.gameTitle}
            </h1>
          )}
          {config.theme.logo.subtitle ? (
            <p className="topbar__subtitle eyebrow">{config.theme.logo.subtitle}</p>
          ) : null}
        </div>

        <div className="topbar__round" aria-hidden="true">
          <p className="topbar__round-title display">
            {state.phase === 'ended'
              ? 'Game over'
              : state.phase === 'pick-own'
                ? 'Round 1'
                : `Round ${roundNumber}`}
            <span className="topbar__round-of"> of {config.rounds.length}</span>
          </p>
          <ol className="progress">
            {config.rounds.map((round, index) => (
              <li
                key={round.id}
                className="progress__dot"
                data-state={
                  index < state.roundIndex ? 'done' : index === state.roundIndex ? 'active' : 'todo'
                }
              />
            ))}
          </ol>
        </div>

        <div className="topbar__controls">
          <SoundToggle />
          <button type="button" className="btn btn--sm btn--ghost" onClick={onExit}>
            {exitLabel}
          </button>
        </div>
      </header>

      <p className="sr-only" role="status" aria-live="polite">
        {headline.title}. {state.message}
      </p>

      <main className="game">
        <div className="game__board">
          <PrizeBoard
            prizes={prizes.all}
            remainingIds={state.remainingPrizeIds}
            showValues={config.rules.showValuesOnBoard}
            labelFor={labelForPrize}
            valueFor={valueForPrize}
            justEliminatedId={state.lastReveal?.prize.id ?? null}
            subtitle={config.mode === 'custom' ? config.description : undefined}
          />
        </div>

        <section className="game__stage" id="case-grid">
          <div className="hud">
            <p className="hud__title display">{headline.title}</p>
            <p className="hud__sub">{headline.sub}</p>
          </div>

          <CaseGrid
            cases={state.cases}
            phase={state.phase}
            finalCandidateId={state.finalCandidateId}
            prizeFor={(id) => prizes.get(id)}
            labelFor={labelForId}
            onSelect={(caseId) =>
              state.phase === 'pick-own' ? game.pickOwnCase(caseId) : game.openCase(caseId)
            }
            onHover={game.hoverCase}
            activeCaseId={state.phase === 'reveal' ? state.lastReveal?.caseId ?? null : null}
          />
        </section>

        <aside className="game__side">
          <section className="side-card panel">
            <h2 className="eyebrow">Your case</h2>
            {playerCase ? (
              <div className="side-card__case">
                <CaseArt number={playerCase.number} state="player" glow />
              </div>
            ) : (
              <p className="side-card__empty text-muted">Not chosen yet</p>
            )}
          </section>

          <section className="side-card panel">
            <h2 className="eyebrow">{state.phase === 'ended' ? 'You walked away with' : 'Board average'}</h2>
            <p className="side-card__stat">
              {state.phase === 'ended' && state.result
                ? state.result.wonLabel
                : engine.getFormattedAverage()}
            </p>
            <p className="side-card__meta text-muted">
              {state.phase === 'ended'
                ? `${state.offers.length} offer${state.offers.length === 1 ? '' : 's'} from ${config.banker.name}`
                : `${casesLeft} ${casesLeft === 1 ? 'case' : 'cases'} still sealed`}
            </p>
          </section>

          <section className="side-card panel side-card--offers">
            <h2 className="eyebrow">{config.banker.name}</h2>
            {state.offers.length === 0 ? (
              <p className="side-card__empty text-muted">No offers yet.</p>
            ) : (
              <ol className="offer-log">
                {state.offers.map((offer) => (
                  <li key={offer.id} className="offer-log__row" data-accepted={String(offer.accepted)}>
                    <span className="offer-log__round">R{offer.round}</span>
                    <span className="offer-log__value">{fmt(offer.value)}</span>
                    <span className="offer-log__state">{offer.accepted ? 'Deal' : 'No deal'}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </aside>
      </main>

      {state.phase === 'reveal' && state.lastReveal ? (
        <RevealOverlay
          reveal={state.lastReveal}
          valueLabel={prizes.valueLabel(state.lastReveal.prize)}
          showValue={config.rules.showValuesOnBoard}
          onSkip={game.skipReveal}
          reducedMotion={settings.reducedMotion}
        />
      ) : null}

      {state.phase === 'banker-calling' ? (
        <BankerCalling banker={config.banker} theme={config.theme} message={state.message} />
      ) : null}

      {state.phase === 'offer' && state.currentOffer ? (
        <OfferOverlay
          offer={state.currentOffer}
          banker={config.banker}
          theme={config.theme}
          headline={
            config.banker.offerPresentation === 'bundle'
              ? `${config.banker.name} wants to buy your case`
              : `${config.banker.name} has made an offer`
          }
          offerLabel={fmt(state.currentOffer.value)}
          averageLabel={engine.getFormattedAverage()}
          casesLeft={casesLeft}
          previousOfferLabel={
            state.offers.length > 0 ? fmt(state.offers[state.offers.length - 1].value) : null
          }
          onDeal={game.acceptDeal}
          onNoDeal={game.declineDeal}
        />
      ) : null}

      {state.phase === 'final-choice' && playerCase && finalOther ? (
        <FinalChoice
          playerCase={playerCase}
          otherCase={finalOther}
          message={state.message}
          allowSwap={config.rules.allowSwapAtEnd}
          onChoose={game.chooseFinal}
        />
      ) : null}

      {state.phase === 'ended' && state.result ? (
        <ResultScreen
          result={state.result}
          playerCaseNumber={playerCase?.number ?? 0}
          playerPrizeLabel={prizes.label(state.result.playerPrize)}
          playerPrizeIcon={state.result.playerPrize.icon}
          offers={state.offers}
          bestOfferLabel={bestOffer !== null ? fmt(bestOffer) : null}
          swapped={state.swapped}
          onRestart={game.restart}
          onExit={onExit}
          exitLabel={exitLabel}
        />
      ) : null}
    </Stage>
  );
}
