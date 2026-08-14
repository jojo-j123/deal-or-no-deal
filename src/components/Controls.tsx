import { useSettings } from '../react/settings.tsx';

function IconButton({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className="icon-btn"
      data-active={active}
      aria-pressed={active}
      title={label}
      aria-label={label}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function SoundToggle() {
  const { settings, update, audio } = useSettings();
  return (
    <IconButton
      active={settings.sound}
      label={settings.sound ? 'Mute sound' : 'Unmute sound'}
      onClick={() => {
        audio.unlock();
        update({ sound: !settings.sound });
      }}
    >
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 9v6h4l5 4V5L8 9H4z" />
        {settings.sound ? (
          <>
            <path d="M16.5 8.5a5 5 0 0 1 0 7" />
            <path d="M19 6a8.5 8.5 0 0 1 0 12" />
          </>
        ) : (
          <path d="M17 9.5l4 5m0-5l-4 5" />
        )}
      </svg>
    </IconButton>
  );
}

export function MusicToggle() {
  const { settings, update, audio } = useSettings();
  return (
    <IconButton
      active={settings.music}
      label={settings.music ? 'Stop music' : 'Play music'}
      onClick={() => {
        audio.unlock();
        update({ music: !settings.music });
      }}
    >
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18V6l10-2v12" />
        <circle cx="6.5" cy="18" r="2.5" />
        <circle cx="16.5" cy="16" r="2.5" />
      </svg>
    </IconButton>
  );
}

export function MotionToggle() {
  const { settings, update } = useSettings();
  return (
    <IconButton
      active={settings.reducedMotion}
      label={settings.reducedMotion ? 'Enable animations' : 'Reduce motion'}
      onClick={() => update({ reducedMotion: !settings.reducedMotion })}
    >
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7v5l3 2" />
      </svg>
    </IconButton>
  );
}

export function SettingsCluster() {
  return (
    <div className="settings-cluster">
      <SoundToggle />
      <MusicToggle />
      <MotionToggle />
    </div>
  );
}
