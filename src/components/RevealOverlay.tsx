import { useEffect, useState } from 'react';
import type { RevealInfo } from '../engine/types.ts';
import { CaseArt } from './CaseArt.tsx';
import type { CaseOpenStage } from './CaseArt.tsx';
import { Overlay } from './Overlay.tsx';

interface RevealOverlayProps {
  reveal: RevealInfo;
  valueLabel: string;
  showValue: boolean;
  onSkip: () => void;
  reducedMotion: boolean;
}

/**
 * The multi-stage opening: the case shakes, the latches spring, the lid lifts,
 * light pours out and the prize lands.
 */
export function RevealOverlay({ reveal, valueLabel, showValue, onSkip, reducedMotion }: RevealOverlayProps) {
  const [stage, setStage] = useState<CaseOpenStage>(reducedMotion ? 'open' : 'closed');

  useEffect(() => {
    if (reducedMotion) {
      setStage('open');
      return;
    }
    setStage('shake');
    const t1 = window.setTimeout(() => setStage('unlock'), 620);
    const t2 = window.setTimeout(() => setStage('open'), 880);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [reveal.caseId, reducedMotion]);

  const opened = stage === 'open';

  return (
    <Overlay label={`Case ${reveal.caseNumber} opening`} variant="reveal" onDismiss={onSkip}>
      <div className={`reveal ${reveal.isBig ? 'reveal--big' : ''}`} data-open={opened}>
        <div className="reveal__beams" aria-hidden="true" />
        <p className="reveal__eyebrow eyebrow">Case {reveal.caseNumber}</p>

        <div className="reveal__case">
          <CaseArt number={reveal.caseNumber} variant="hero" stage={stage} glow={reveal.isBig}>
            {reveal.prize.icon ? <span className="reveal__icon">{reveal.prize.icon}</span> : null}
            {/* The prize is revealed in the case itself, not in a caption. */}
            <span className="reveal__prize display">{reveal.prize.displayName || valueLabel}</span>
            {showValue && reveal.prize.displayName ? (
              <span className="reveal__value">{valueLabel}</span>
            ) : null}
          </CaseArt>
        </div>

        <div className="reveal__card" aria-live="assertive">
          <p className="sr-only">
            Case {reveal.caseNumber} contained {reveal.prize.displayName || valueLabel}.
          </p>
          {reveal.prize.description ? (
            <p className="reveal__desc text-muted">{reveal.prize.description}</p>
          ) : null}
          <p className="reveal__line">{reveal.line}</p>
        </div>

        <p className="reveal__hint text-muted">Click anywhere to continue</p>
      </div>
    </Overlay>
  );
}
