import { useEffect, useRef, useState } from 'react';
import type { BankerConfig, Offer, ThemeConfig } from '../engine/types.ts';
import { Overlay } from './Overlay.tsx';

interface BankerCallingProps {
  banker: BankerConfig;
  theme: ThemeConfig;
  message: string;
}

/** The anticipation beat: the phone rings before any number appears. */
export function BankerCalling({ banker, theme, message }: BankerCallingProps) {
  return (
    <Overlay label={`${banker.name} is calling`} variant="banker">
      <div className="calling">
        <div className="calling__figure" aria-hidden="true">
          <span className="calling__ring calling__ring--1" />
          <span className="calling__ring calling__ring--2" />
          <span className="calling__ring calling__ring--3" />
          {theme.banker.avatarUrl ? (
            <img className="calling__avatar" src={theme.banker.avatarUrl} alt="" />
          ) : (
            <span className="calling__emoji">{theme.banker.emoji}</span>
          )}
        </div>
        <p className="calling__title display">{banker.name}</p>
        <p className="calling__sub" aria-live="polite">{message || 'is calling…'}</p>
      </div>
    </Overlay>
  );
}

interface OfferOverlayProps {
  offer: Offer;
  banker: BankerConfig;
  theme: ThemeConfig;
  headline: string;
  offerLabel: string;
  averageLabel: string;
  casesLeft: number;
  previousOfferLabel: string | null;
  onDeal: () => void;
  onNoDeal: () => void;
}

/**
 * The decision. The number lands first, the buttons arm a beat later so the
 * player can't reflexively click through the most important moment.
 */
export function OfferOverlay({
  offer,
  banker,
  theme,
  headline,
  offerLabel,
  averageLabel,
  casesLeft,
  previousOfferLabel,
  onDeal,
  onNoDeal,
}: OfferOverlayProps) {
  const [armed, setArmed] = useState(false);
  const [remaining, setRemaining] = useState(banker.countdownSeconds);
  const noDealRef = useRef(onNoDeal);
  noDealRef.current = onNoDeal;

  useEffect(() => {
    const id = window.setTimeout(() => setArmed(true), 900);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (banker.countdownSeconds <= 0 || !armed) return;
    const id = window.setInterval(() => {
      setRemaining((value) => {
        if (value <= 1) {
          window.clearInterval(id);
          noDealRef.current();
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [armed, banker.countdownSeconds]);

  const isBundle = banker.offerPresentation === 'bundle' && offer.bundle.length > 0;
  const urgent = banker.countdownSeconds > 0 && remaining <= 5;

  return (
    <Overlay label="The Banker has made an offer" variant="banker">
      <div className="offer">
        <div className="offer__banker" aria-hidden="true">
          {theme.banker.avatarUrl ? (
            <img src={theme.banker.avatarUrl} alt="" />
          ) : (
            <span className="offer__emoji">{theme.banker.emoji}</span>
          )}
        </div>

        <p className="offer__eyebrow eyebrow">{headline}</p>

        {isBundle ? (
          <div className="offer__bundle">
            {offer.bundle.map((item, index) => (
              <span className="offer__bundle-item" key={item.id} style={{ animationDelay: `${index * 130}ms` }}>
                {item.icon ? <span className="offer__bundle-icon">{item.icon}</span> : null}
                <span>{item.displayName}</span>
              </span>
            ))}
          </div>
        ) : (
          <p className="offer__value display gold-text" aria-live="assertive">
            {offerLabel}
          </p>
        )}
        {isBundle ? (
          <p className="offer__worth text-muted" aria-live="assertive">
            worth about {offerLabel}
          </p>
        ) : null}

        <p className="offer__line">{offer.line}</p>

        <dl className="offer__stats">
          <div>
            <dt>Average remaining</dt>
            <dd>{averageLabel}</dd>
          </div>
          <div>
            <dt>Cases left</dt>
            <dd>{casesLeft}</dd>
          </div>
          {previousOfferLabel ? (
            <div>
              <dt>Last offer</dt>
              <dd>{previousOfferLabel}</dd>
            </div>
          ) : null}
        </dl>

        <div className="offer__actions">
          <button type="button" className="btn btn--lg btn--primary offer__deal" onClick={onDeal} disabled={!armed}>
            Deal
          </button>
          <button type="button" className="btn btn--lg btn--danger offer__nodeal" onClick={onNoDeal} disabled={!armed}>
            No Deal
          </button>
        </div>

        {banker.countdownSeconds > 0 ? (
          <p className={`offer__countdown ${urgent ? 'is-urgent' : ''}`} aria-live="polite">
            {remaining > 0 ? `${remaining}s to decide — silence means no deal` : 'Time!'}
          </p>
        ) : null}
      </div>
    </Overlay>
  );
}
