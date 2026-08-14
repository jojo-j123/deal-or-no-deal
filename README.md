# Deal or No Deal — a configurable game show engine

A browser game in the Deal or No Deal format, built so that **money is not a
special case**. Cases hold prizes; a prize is a name with an optional numeric
value. The Banker does arithmetic on those values, the board shows the names,
and nothing in the engine knows what a dollar is.

```
GameEngine ── GameState ── React components ── animation / audio
     │
     └── PrizeManager · CaseManager · RoundManager · BankerEngine · OfferCalculator
```

## Running it

```bash
npm install
npm run dev            # http://localhost:5173
npm run build          # type-check + production build
npm run preview        # serve the build on :4173
npm run smoke          # end-to-end playthrough against the preview server
```

`npm run smoke` drives a real browser: it plays all three demo games to a
result, exercises the creator, changes the case count, playtests the edited
game and checks the mobile layout for horizontal overflow. It fails on any page
error or on a game phase that stops advancing.

## The three demos

| Game | Cases | Prizes | Point it proves |
| --- | --- | --- | --- |
| **Deal or No Deal** | 26 | $0.01 → $1,000,000 | The classic board. Prizes carry no display name, so the board renders the *formatted value* — change `valueFormat.currency` to EUR and all 26 rows follow. |
| **Ultimate Prize Box** | 20 | Rubber Duck → The Vault | Items, not money. The Banker still bids, but pays in goods: offers are composed into bundles ("Gaming Laptop + Vacation Package") from a catalogue. |
| **Dragon's Hoard** | 12 | Rusted Dagger → Immortality | Values denominated in `gold`, not currency. Same engine, same Banker, different unit. |

## Architecture

Game logic is plain TypeScript with no React, no DOM and no timers.

| Module | Responsibility |
| --- | --- |
| `engine/GameEngine.ts` | The state machine: `setup → pick-own → opening → reveal → banker-calling → offer → final-choice → ended`. Exposes commands and a subscribe/event API. |
| `engine/PrizeManager.ts` | Prize lookup, board ordering, value statistics, what counts as a "big" prize in *this* game. |
| `engine/CaseManager.ts` | Dealing prizes into cases and answering what is still in play. |
| `engine/RoundManager.ts` | Generates and validates round schedules for any case count (26 → `6,5,4,3,2,1,1,1,1`). |
| `engine/OfferCalculator.ts` | The offer maths, with every term exposed on a breakdown. |
| `engine/BankerEngine.ts` | Wraps the maths in dialogue and, for item games, bundle composition. |
| `engine/ConfigManager.ts` | Defaults, validation, JSON import/export, local storage. |
| `theme/ThemeManager.ts` | Projects a theme onto CSS custom properties. |
| `audio/AudioManager.ts` | Cue playback: samples when configured, synthesised fallbacks otherwise. |
| `react/useGameEngine.ts` | The only place that owns time — how long a reveal lingers, when the phone stops ringing, when the screen shakes. |

The engine never renders and the components never decide game rules. Everything
the player sees — titles, prize names, round counts, the Banker's lines, the
colours, the case material — comes from one `GameConfig` object.

## The offer algorithm

The Banker is not a random number generator. `calculateOffer` combines:

* **Risk tilt** — a rank-weighted mean of the remaining values. Above 50 the
  Banker acts as if the big prizes are still out there; below 50, the opposite.
* **Round curve** — offers start at roughly a quarter of the average and
  converge on (occasionally exceed) it as the board tightens.
* **Spread penalty** — a wide board is risky to buy out, so the offer dips.
* **Personality** — `fair`, `ruthless`, `generous`, `chaotic`, `showman`
  (cheap early, generous late).
* **Aggressiveness / generosity / jitter**, then rails so the offer never falls
  below the worst case still in play or exceeds the best one, and never
  collapses after a round that improved the board.

The creator's Banker tab simulates the whole curve live — opening rounds,
halfway, three left, final two — so tuning is not guesswork.

## Making a game without touching code

The creator (**Create a game** on the menu) covers general settings and value
formatting, prizes, the round schedule, the Banker, the theme, audio and every
line of dialogue. Validation is continuous: the rounds must open exactly
`caseCount - 2` cases, there must be one prize per case, and the tab shows a dot
when a section has an error. **Playtest** launches the real game with the
in-progress config and returns to the editor afterwards.

Configurations save to local storage and export as JSON:

```json
{
  "schemaVersion": 1,
  "gameTitle": "Mystery Vault",
  "mode": "custom",
  "caseCount": 26,
  "prizes": [{ "id": "p1", "name": "Sports Car", "displayName": "Sports Car", "estimatedValue": 75000, "icon": "🏎️" }],
  "rounds": [{ "id": "r1", "casesToOpen": 6, "offerAfter": true }],
  "banker": { "personality": "showman", "aggressiveness": 58 },
  "theme": { "colors": {}, "effects": {} },
  "valueFormat": { "style": "currency", "currency": "USD" }
}
```

Import is forgiving — anything missing is filled from defaults, so a
hand-written or older file still loads.

## Themes

Five presets (Classic, Neon, Luxury, Arcade, Horror) plus full customisation:
background, five colours, case style and material, button style, fonts, glow,
vignette, particles, scanlines, grain, spotlights, logo, and the Banker's
avatar. Themes are pure data projected onto CSS variables, so switching one
repaints the game without re-rendering the tree.

## Accessibility

* Arrow-key navigation across the case grid with a single tab stop, `Home`/`End`
  to jump to the ends.
* Visible focus rings on every control, including the cases.
* Modals trap focus and restore it on close; each announces itself.
* Live regions announce the round, the reveal and the Banker's offer.
* A reduced-motion toggle (which also respects `prefers-reduced-motion`)
  shortens every dramatic beat and disables particles and drifting lights.
* Sound is off until the player interacts, and the game is fully playable
  silently.

## Audio

Every cue — case open, reveal, big reveal, phone, offer, deal, no deal, win,
loss — is synthesised from oscillators, so the game ships with a complete sound
design and no asset files. Point any cue at a URL in the config to replace it;
if that file fails to load, the synth quietly takes over. Nothing in the audio
layer can throw into the game loop.
