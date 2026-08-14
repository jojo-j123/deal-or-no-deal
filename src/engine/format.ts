import type { ValueFormat } from './types.ts';

/**
 * All value-to-string conversion goes through here, driven entirely by config.
 * A game can be denominated in dollars, credits, points, calories or nothing.
 */
export function formatValue(value: number | undefined | null, fmt: ValueFormat): string {
  if (value === undefined || value === null || Number.isNaN(value)) return '—';
  if (fmt.style === 'none') return '';

  let body: string;
  if (fmt.style === 'currency') {
    try {
      body = new Intl.NumberFormat(fmt.locale, {
        style: 'currency',
        currency: fmt.currency,
        maximumFractionDigits: fmt.maximumFractionDigits,
        minimumFractionDigits: value % 1 === 0 ? 0 : Math.min(2, fmt.maximumFractionDigits),
      }).format(value);
    } catch {
      body = value.toLocaleString(fmt.locale);
    }
  } else if (fmt.style === 'compact') {
    try {
      body = new Intl.NumberFormat(fmt.locale, {
        notation: 'compact',
        maximumFractionDigits: Math.max(1, fmt.maximumFractionDigits),
      }).format(value);
    } catch {
      body = String(value);
    }
  } else {
    body = value.toLocaleString(fmt.locale, {
      maximumFractionDigits: fmt.maximumFractionDigits,
    });
  }

  return `${fmt.prefix}${body}${fmt.suffix}`;
}

/** Fill `{token}` placeholders in dialogue strings. */
export function template(text: string, tokens: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in tokens ? String(tokens[key]) : match,
  );
}

export const defaultValueFormat: ValueFormat = {
  style: 'currency',
  currency: 'USD',
  locale: 'en-US',
  prefix: '',
  suffix: '',
  maximumFractionDigits: 2,
};
