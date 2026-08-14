import type { GameResult, Offer } from '../engine/types.ts';
import { Overlay } from './Overlay.tsx';

interface ResultScreenProps {
  result: GameResult;
  playerCaseNumber: number;
  playerPrizeLabel: string;
  playerPrizeIcon?: string;
  offers: Offer[];
  bestOfferLabel: string | null;
  swapped: boolean;
  onRestart: () => void;
  onExit: () => void;
  exitLabel?: string;
}

export function ResultScreen({
  result,
  playerCaseNumber,
  playerPrizeLabel,
  playerPrizeIcon,
  offers,
  bestOfferLabel,
  swapped,
  onRestart,
  onExit,
  exitLabel = 'Back to games',
}: ResultScreenProps) {
  const good = result.percentile >= 0.5;
  const dealt = result.outcome === 'deal';

  const verdict = dealt
    ? result.betterThanCase
      ? 'You beat your own case. The Banker paid too much.'
      : 'Your case was worth more. The Banker won that one.'
    : swapped
      ? result.betterThanCase
        ? 'The swap paid off.'
        : 'The swap cost you.'
      : 'You held your case to the very end.';

  return (
    <Overlay label="Game over" variant="result">
      <div className={`result ${good ? 'result--good' : 'result--bad'}`}>
        <p className="result__eyebrow eyebrow">{dealt ? 'Deal struck' : 'Final case'}</p>
        <h2 className="result__headline display gold-text">You walk away with</h2>

        <p className="result__prize display" aria-live="assertive">
          {result.wonLabel}
        </p>

        <p className="result__message">{result.message}</p>

        <div className="result__compare panel panel--flush">
          <div className="result__compare-item">
            <span className="eyebrow">Case {playerCaseNumber}{dealt ? ' held' : ''}</span>
            <span className="result__compare-value">
              {playerPrizeIcon ? <span aria-hidden="true">{playerPrizeIcon} </span> : null}
              {playerPrizeLabel}
            </span>
          </div>
          <div className="result__compare-item">
            <span className="eyebrow">Offers received</span>
            <span className="result__compare-value">{offers.length}</span>
          </div>
          {bestOfferLabel ? (
            <div className="result__compare-item">
              <span className="eyebrow">Best offer</span>
              <span className="result__compare-value">{bestOfferLabel}</span>
            </div>
          ) : null}
        </div>

        <p className="result__verdict">{verdict}</p>

        <div className="result__actions">
          <button type="button" className="btn btn--lg btn--primary" onClick={onRestart}>
            Play again
          </button>
          <button type="button" className="btn btn--lg btn--ghost" onClick={onExit}>
            {exitLabel}
          </button>
        </div>
      </div>
    </Overlay>
  );
}
