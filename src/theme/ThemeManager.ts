import type { ThemeConfig } from '../engine/types.ts';

/**
 * Projects a theme object onto CSS custom properties. Components never read
 * the theme directly — they read variables, so any theme change is a repaint.
 */

function hexToRgb(color: string): string | null {
  const value = color.trim();
  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(value);
  if (short) {
    const [, r, g, b] = short;
    return `${parseInt(r + r, 16)}, ${parseInt(g + g, 16)}, ${parseInt(b + b, 16)}`;
  }
  const long = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(value);
  if (long) {
    const [, r, g, b] = long;
    return `${parseInt(r, 16)}, ${parseInt(g, 16)}, ${parseInt(b, 16)}`;
  }
  const rgb = /^rgba?\(([^)]+)\)$/i.exec(value);
  if (rgb) {
    const parts = rgb[1].split(',').map((p) => p.trim());
    if (parts.length >= 3) return parts.slice(0, 3).join(', ');
  }
  return null;
}

function setVar(el: HTMLElement, name: string, value: string): void {
  el.style.setProperty(name, value);
}

function setColor(el: HTMLElement, name: string, value: string): void {
  setVar(el, `--${name}`, value);
  const rgb = hexToRgb(value);
  if (rgb) setVar(el, `--${name}-rgb`, rgb);
}

export const ThemeManager = {
  apply(theme: ThemeConfig, target?: HTMLElement | null): void {
    const el = target ?? document.documentElement;

    setColor(el, 'c-primary', theme.colors.primary);
    setColor(el, 'c-secondary', theme.colors.secondary);
    setColor(el, 'c-accent', theme.colors.accent);
    setColor(el, 'c-text', theme.colors.text);
    setColor(el, 'c-muted', theme.colors.textMuted);
    setColor(el, 'c-danger', theme.colors.danger);
    setColor(el, 'c-success', theme.colors.success);
    setVar(el, '--c-surface', theme.colors.surface);

    setVar(el, '--bg-base', theme.background.value);
    setVar(
      el,
      '--bg-image',
      theme.background.type === 'image' && theme.background.image
        ? `url("${theme.background.image}")`
        : 'none',
    );
    setVar(el, '--bg-overlay', String(Math.min(100, Math.max(0, theme.background.overlay)) / 100));

    setVar(el, '--case-material', theme.caseMaterial);
    setColor(el, 'case-glow', theme.caseGlow);

    setVar(el, '--font-display', theme.fonts.display);
    setVar(el, '--font-body', theme.fonts.body);

    setVar(el, '--fx-glow', String(Math.min(100, Math.max(0, theme.effects.glow)) / 100));
    setVar(el, '--fx-vignette', String(Math.min(100, Math.max(0, theme.effects.vignette)) / 100));

    el.dataset.caseStyle = theme.caseStyle;
    el.dataset.buttonStyle = theme.buttonStyle;
    el.dataset.themeId = theme.id;
    el.dataset.scanlines = String(theme.effects.scanlines);
    el.dataset.grain = String(theme.effects.grain);
    el.dataset.spotlight = String(theme.effects.spotlight);

    if (theme.banker.roomImage) {
      setVar(el, '--banker-room', `url("${theme.banker.roomImage}")`);
    } else {
      el.style.removeProperty('--banker-room');
    }
  },

  /** Inline style object for previews inside the creator. */
  toStyle(theme: ThemeConfig): Record<string, string> {
    return {
      '--c-primary': theme.colors.primary,
      '--c-secondary': theme.colors.secondary,
      '--c-accent': theme.colors.accent,
      '--c-text': theme.colors.text,
      '--c-muted': theme.colors.textMuted,
      '--bg-base': theme.background.value,
      '--case-material': theme.caseMaterial,
      '--case-glow': theme.caseGlow,
      '--font-display': theme.fonts.display,
    };
  },
};

export const REDUCED_MOTION_KEY = 'dond.reducedMotion';

export function prefersReducedMotion(): boolean {
  try {
    const stored = localStorage.getItem(REDUCED_MOTION_KEY);
    if (stored === 'true') return true;
    if (stored === 'false') return false;
  } catch {
    /* ignore */
  }
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function setReducedMotion(enabled: boolean): void {
  try {
    localStorage.setItem(REDUCED_MOTION_KEY, String(enabled));
  } catch {
    /* ignore */
  }
  document.documentElement.dataset.reducedMotion = String(enabled);
}
