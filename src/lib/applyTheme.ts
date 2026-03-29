import { type Event, getThemeColors } from '../state/useEventStore';

// ── Font catalogue ────────────────────────────────────────────────────────────
// Each pairing has a decorative/script heading font and a clean readable body font.
// "value" is what gets stored in events.theme_json.fontPair.
export const FONT_PAIRINGS = [
  {
    value: 'default',
    label: 'Default (Inter)',
    heading: 'Inter',
    body: 'Inter',
    preview: 'Aa',
  },
  {
    value: 'great-vibes',
    label: 'Great Vibes + Lato',
    heading: 'Great Vibes',
    body: 'Lato',
    preview: 'Great Vibes',
  },
  {
    value: 'pinyon-script',
    label: 'Pinyon Script + Lato',
    heading: 'Pinyon Script',
    body: 'Lato',
    preview: 'Pinyon Script',
  },
  {
    value: 'dancing-script',
    label: 'Dancing Script + Raleway',
    heading: 'Dancing Script',
    body: 'Raleway',
    preview: 'Dancing Script',
  },
  {
    value: 'alex-brush',
    label: 'Alex Brush + Montserrat',
    heading: 'Alex Brush',
    body: 'Montserrat',
    preview: 'Alex Brush',
  },
  {
    value: 'tangerine',
    label: 'Tangerine + Source Sans 3',
    heading: 'Tangerine',
    body: 'Source Sans 3',
    preview: 'Tangerine',
  },
  {
    value: 'niconne',
    label: 'Niconne + Nunito',
    heading: 'Niconne',
    body: 'Nunito',
    preview: 'Niconne',
  },
] as const;

export type FontPairingValue = typeof FONT_PAIRINGS[number]['value'];

// ── Font loader (idempotent) ──────────────────────────────────────────────────
const _loaded = new Set<string>();

function injectGoogleFont(heading: string, body: string) {
  const key = `${heading}||${body}`;
  if (_loaded.has(key)) return;
  _loaded.add(key);

  // Build the families query, skip Inter (already bundled in the project)
  const families = [...new Set([heading, body])]
    .filter((f) => f !== 'Inter')
    .map((f) => {
      // Script fonts don't support all weight variants — request what's available
      const isScript = ['Great Vibes', 'Pinyon Script', 'Alex Brush', 'Tangerine', 'Niconne'].includes(f);
      return isScript
        ? `family=${encodeURIComponent(f)}&display=swap`
        : `family=${encodeURIComponent(f)}:wght@400;500;600;700&display=swap`;
    });

  if (!families.length) return;

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?${families.join('&')}`;
  document.head.appendChild(link);
}

// ── Main utility — call inside useEffect([event]) in any public page ──────────
export function applyTheme(event: Event | null) {
  if (!event) return;

  const theme = getThemeColors(event);
  const root = document.documentElement;

  const hexToRgb = (hex: string): string => {
    const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return r
      ? `${parseInt(r[1], 16)}, ${parseInt(r[2], 16)}, ${parseInt(r[3], 16)}`
      : '37, 99, 235';
  };

  // Colors
  root.style.setProperty('--theme-primary', theme.primary);
  root.style.setProperty('--theme-secondary', theme.secondary);
  root.style.setProperty('--theme-text', theme.text);
  root.style.setProperty('--theme-background', theme.background);
  root.style.setProperty('--theme-accent', theme.accent);
  root.style.setProperty('--theme-accent-rgb', hexToRgb(theme.accent));
  root.style.setProperty('--theme-container', theme.container);
  root.style.setProperty('--theme-container-rgb', hexToRgb(theme.container));
  root.style.setProperty('--theme-nav-font-color', theme.navFontColor);
  root.style.setProperty('--theme-nav-font-size', `${theme.navFontSize}rem`);
  document.body.style.backgroundColor = theme.background;

  // Fonts
  const pair = FONT_PAIRINGS.find((p) => p.value === theme.fontPair) ?? FONT_PAIRINGS[0];
  injectGoogleFont(pair.heading, pair.body);

  const headingStack =
    pair.heading === 'Inter'
      ? 'inherit'
      : `'${pair.heading}', cursive`;

  const bodyStack =
    pair.body === 'Inter'
      ? 'inherit'
      : `'${pair.body}', sans-serif`;

  root.style.setProperty('--theme-font-heading', headingStack);
  root.style.setProperty('--theme-font-body', bodyStack);
}
