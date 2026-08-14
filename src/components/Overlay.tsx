import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

interface OverlayProps {
  children: ReactNode;
  label: string;
  variant?: 'reveal' | 'banker' | 'final' | 'result';
  /** Clicking the backdrop calls this, when the moment is skippable. */
  onDismiss?: () => void;
  className?: string;
}

const FOCUSABLE =
  'button:not(:disabled), [href], input:not(:disabled), select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Modal shell: backdrop, entrance animation, focus containment and an
 * announcement for screen readers. Keeps the dramatic moments accessible.
 */
export function Overlay({ children, label, variant = 'reveal', onDismiss, className = '' }: OverlayProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const first = node.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? node).focus({ preventScroll: true });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const focusable = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null,
      );
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const firstEl = focusable[0];
      const lastEl = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === firstEl) {
        event.preventDefault();
        lastEl.focus();
      } else if (!event.shiftKey && document.activeElement === lastEl) {
        event.preventDefault();
        firstEl.focus();
      }
    };

    node.addEventListener('keydown', onKeyDown);
    return () => {
      node.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, []);

  return (
    <div
      className={`overlay overlay--${variant} ${className}`}
      role="dialog"
      aria-modal="true"
      aria-label={label}
      tabIndex={-1}
      ref={ref}
    >
      <button
        type="button"
        className="overlay__backdrop"
        aria-label={onDismiss ? 'Skip' : 'Background'}
        tabIndex={onDismiss ? 0 : -1}
        onClick={() => onDismiss?.()}
        disabled={!onDismiss}
      />
      <div className="overlay__body">{children}</div>
    </div>
  );
}
