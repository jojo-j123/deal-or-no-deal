import type { ThemeConfig } from '../engine/types.ts';

/**
 * Themes are pure data. Every value below lands on a CSS custom property, so a
 * new look never requires a component change.
 */

const FONT_BODY = "'Inter', 'SF Pro Text', system-ui, -apple-system, 'Segoe UI', sans-serif";

export const classicTheme: ThemeConfig = {
  id: 'classic',
  name: 'Classic',
  background: {
    type: 'gradient',
    value:
      'radial-gradient(120% 90% at 50% -10%, #2a2214 0%, #16130d 42%, #0a0908 72%, #050505 100%)',
    overlay: 0,
  },
  colors: {
    primary: '#f2c14e',
    secondary: '#8b6b23',
    accent: '#ffeab3',
    text: '#f7f2e6',
    textMuted: '#a99f8b',
    surface: 'rgba(24, 20, 14, 0.66)',
    danger: '#e2503f',
    success: '#57d68b',
  },
  caseStyle: 'metal',
  caseMaterial:
    'linear-gradient(155deg, #f4f7fa 0%, #c2cbd6 22%, #8e99a7 48%, #6a7482 62%, #aab4c1 84%, #dfe6ee 100%)',
  caseGlow: '#f2c14e',
  buttonStyle: 'gold',
  fonts: {
    display: "'Bebas Neue', 'Oswald', Impact, 'Arial Narrow', sans-serif",
    body: FONT_BODY,
  },
  effects: { glow: 70, particles: true, vignette: 55, scanlines: false, grain: true, spotlight: true },
  logo: { subtitle: 'The Classic Game' },
  banker: { emoji: '🕴️' },
};

export const neonTheme: ThemeConfig = {
  id: 'neon',
  name: 'Neon',
  background: {
    type: 'gradient',
    value:
      'radial-gradient(100% 80% at 20% 0%, #2a0f5e 0%, #12083a 38%, #070420 68%, #03020f 100%)',
    overlay: 0,
  },
  colors: {
    primary: '#b14bff',
    secondary: '#1fd8ff',
    accent: '#ff3ea5',
    text: '#ecf6ff',
    textMuted: '#8ea6c9',
    surface: 'rgba(12, 8, 38, 0.62)',
    danger: '#ff4d6d',
    success: '#31f2b8',
  },
  caseStyle: 'neon',
  caseMaterial:
    'linear-gradient(155deg, #3b1f6e 0%, #241150 26%, #150a33 55%, #2b1560 78%, #4a2a8a 100%)',
  caseGlow: '#1fd8ff',
  buttonStyle: 'neon',
  fonts: {
    display: "'Orbitron', 'Bebas Neue', 'Trebuchet MS', sans-serif",
    body: FONT_BODY,
  },
  effects: { glow: 100, particles: true, vignette: 45, scanlines: true, grain: false, spotlight: true },
  logo: { subtitle: 'Overdrive' },
  banker: { emoji: '🤖' },
};

export const luxuryTheme: ThemeConfig = {
  id: 'luxury',
  name: 'Luxury',
  background: {
    type: 'gradient',
    value:
      'radial-gradient(110% 85% at 50% 0%, #1c1710 0%, #100d09 45%, #070605 75%, #030302 100%)',
    overlay: 0,
  },
  colors: {
    primary: '#e3c68b',
    secondary: '#6d5730',
    accent: '#fff4dc',
    text: '#f4ece0',
    textMuted: '#9d9280',
    surface: 'rgba(18, 15, 11, 0.55)',
    danger: '#c2453c',
    success: '#66c99a',
  },
  caseStyle: 'glass',
  caseMaterial:
    'linear-gradient(155deg, rgba(255,246,224,0.22) 0%, rgba(227,198,139,0.16) 30%, rgba(30,26,20,0.55) 60%, rgba(255,244,220,0.18) 100%)',
  caseGlow: '#e3c68b',
  buttonStyle: 'glass',
  fonts: {
    display: "'Cinzel', 'Bebas Neue', Georgia, 'Times New Roman', serif",
    body: FONT_BODY,
  },
  effects: { glow: 60, particles: true, vignette: 65, scanlines: false, grain: true, spotlight: true },
  logo: { subtitle: 'Private Salon' },
  banker: { emoji: '🥂' },
};

export const arcadeTheme: ThemeConfig = {
  id: 'arcade',
  name: 'Arcade',
  background: {
    type: 'gradient',
    value:
      'radial-gradient(100% 80% at 50% -5%, #2c1f8a 0%, #1b1360 35%, #120b3d 65%, #0a0626 100%)',
    overlay: 0,
  },
  colors: {
    primary: '#ffd23f',
    secondary: '#21d4fd',
    accent: '#ff5f8d',
    text: '#ffffff',
    textMuted: '#a9b4e6',
    surface: 'rgba(20, 16, 60, 0.6)',
    danger: '#ff4b5c',
    success: '#3ddc84',
  },
  caseStyle: 'matte',
  caseMaterial:
    'linear-gradient(155deg, #ff6f61 0%, #ffb03a 30%, #21d4fd 62%, #7a5cff 100%)',
  caseGlow: '#21d4fd',
  buttonStyle: 'solid',
  fonts: {
    display: "'Bebas Neue', 'Trebuchet MS', Impact, sans-serif",
    body: FONT_BODY,
  },
  effects: { glow: 85, particles: true, vignette: 30, scanlines: false, grain: false, spotlight: false },
  logo: { subtitle: 'Play to Win' },
  banker: { emoji: '🎪' },
};

export const horrorTheme: ThemeConfig = {
  id: 'horror',
  name: 'Horror',
  background: {
    type: 'gradient',
    value:
      'radial-gradient(110% 85% at 50% 0%, #2a0a0a 0%, #150506 40%, #0a0304 70%, #030102 100%)',
    overlay: 0,
  },
  colors: {
    primary: '#c8382c',
    secondary: '#5c1015',
    accent: '#ff6a4d',
    text: '#e9dbd7',
    textMuted: '#8d7a76',
    surface: 'rgba(18, 8, 8, 0.68)',
    danger: '#ff3b30',
    success: '#7fae6a',
  },
  caseStyle: 'carbon',
  caseMaterial:
    'linear-gradient(155deg, #3a3336 0%, #23191b 30%, #140d0e 58%, #2c2124 80%, #443639 100%)',
  caseGlow: '#c8382c',
  buttonStyle: 'solid',
  fonts: {
    display: "'Cinzel', 'Bebas Neue', Georgia, serif",
    body: FONT_BODY,
  },
  effects: { glow: 55, particles: true, vignette: 85, scanlines: false, grain: true, spotlight: true },
  logo: { subtitle: 'Do Not Open' },
  banker: { emoji: '💀' },
};

export const themePresets: ThemeConfig[] = [
  classicTheme,
  neonTheme,
  luxuryTheme,
  arcadeTheme,
  horrorTheme,
];

export function getThemePreset(id: string): ThemeConfig {
  return themePresets.find((t) => t.id === id) ?? classicTheme;
}

export function cloneTheme(theme: ThemeConfig): ThemeConfig {
  return JSON.parse(JSON.stringify(theme)) as ThemeConfig;
}
