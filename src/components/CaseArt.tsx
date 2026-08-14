import type { ReactNode } from 'react';

export type CaseVisualState = 'idle' | 'player' | 'opened' | 'candidate';
export type CaseOpenStage = 'closed' | 'shake' | 'unlock' | 'open';

interface CaseArtProps {
  number: number;
  state?: CaseVisualState;
  variant?: 'tile' | 'hero';
  stage?: CaseOpenStage;
  /** Shown inside the case once the lid is open (hero variant). */
  children?: ReactNode;
  glow?: boolean;
}

/**
 * A single briefcase, assembled from layered elements rather than an image so
 * it inherits the theme's material, glow and lighting.
 *
 * The lid carries the handle, the face and the hardware, and pivots on its top
 * edge to open; the interior sits behind it and holds the prize.
 */
export function CaseArt({
  number,
  state = 'idle',
  variant = 'tile',
  stage = 'closed',
  children,
  glow = false,
}: CaseArtProps) {
  return (
    <span
      className="case"
      data-state={state}
      data-variant={variant}
      data-stage={stage}
      data-glow={glow ? 'true' : 'false'}
      aria-hidden="true"
    >
      <span className="case__aura" />
      <span className="case__shell">
        <span className="case__interior">
          <span className="case__lining" />
          <span className="case__light" />
          <span className="case__contents">{children}</span>
        </span>

        <span className="case__lid">
          <span className="case__handle" />
          <span className="case__clasp case__clasp--l" />
          <span className="case__clasp case__clasp--r" />
          <span className="case__body">
            <span className="case__plate">
              <span className="case__number">{number}</span>
            </span>
            <span className="case__seam" />
            <span className="case__rivet case__rivet--tl" />
            <span className="case__rivet case__rivet--tr" />
            <span className="case__rivet case__rivet--bl" />
            <span className="case__rivet case__rivet--br" />
            <span className="case__sheen" />
          </span>
        </span>
      </span>
      <span className="case__shadow" />
    </span>
  );
}
