import type { CaseState } from '../engine/types.ts';
import { CaseArt } from './CaseArt.tsx';
import { Overlay } from './Overlay.tsx';

interface FinalChoiceProps {
  playerCase: CaseState;
  otherCase: CaseState;
  message: string;
  allowSwap: boolean;
  onChoose: (choice: 'keep' | 'swap') => void;
}

/** Two cases, one decision, no board to hide behind. */
export function FinalChoice({ playerCase, otherCase, message, allowSwap, onChoose }: FinalChoiceProps) {
  return (
    <Overlay label="Final two cases" variant="final">
      <div className="final">
        <p className="final__eyebrow eyebrow">Final Two</p>
        <h2 className="final__title display gold-text">Keep it, or swap?</h2>
        <p className="final__message">{message}</p>

        <div className="final__cases">
          <button type="button" className="final__case" onClick={() => onChoose('keep')}>
            <CaseArt number={playerCase.number} state="player" glow />
            <span className="final__case-tag">Your case</span>
            <span className="final__case-action">Keep</span>
          </button>

          <span className="final__vs display" aria-hidden="true">or</span>

          <button
            type="button"
            className="final__case"
            onClick={() => onChoose('swap')}
            disabled={!allowSwap}
          >
            <CaseArt number={otherCase.number} state="candidate" glow />
            <span className="final__case-tag">Case {otherCase.number}</span>
            <span className="final__case-action">Swap</span>
          </button>
        </div>
      </div>
    </Overlay>
  );
}
