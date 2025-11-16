# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Eye Exercise App - A Progressive Web App (PWA) built with Preact that guides users through a series of timed eye exercises. The app uses voice synthesis to announce exercises, plays sounds for transitions, and prevents screen sleep during workouts.

## Build and Development Commands

```bash
# Development server (with network access via --host)
yarn dev

# Production build
yarn build

# Preview production build
yarn preview

# Format code
yarn format

# Run tests (watch mode)
yarn test

# Run tests with coverage
yarn coverage
```

### Testing

- Tests use Vitest with jsdom environment and @testing-library/preact
- Test files: `src/**/*.test.{ts,tsx}`
- Setup file: `src/test/setup.ts` (automatically imports jest-dom matchers)
- Use `vi.fn()` for mocks, `render()` from @testing-library/preact, and jest-dom matchers

## Architecture

### State Management Pattern

The app uses a **timeline-based state machine** where exercises are broken down into segments (work/rest periods). State flows from `App.tsx` down through components:

1. **App.tsx** - Main state container that:

   - Maintains `AppState` with current exercise index, segment index, and timeline
   - Runs a 1-second interval timer that checks if current segment is complete
   - Auto-advances through segments and exercises based on elapsed time
   - Manages audio (work/rest transition sounds) and speech synthesis

2. **Timeline Generation** - `genExerciseSegments()` converts Exercise definitions into ExerciseSegment arrays:

   - Each segment has `type` ("w" for work, "r" for rest), `startOffset`, `endOffset`, and `duration`
   - For exercises with repetitions and rest periods, segments alternate between work and rest
   - Offsets are in milliseconds, durations in seconds

3. **Time Tracking** - Uses `startedAt` timestamp and `Date.now()` to calculate elapsed time:
   - `secondsElapsedInSegment` is derived each tick for UI updates
   - Timer transitions when `Date.now() >= startedAt + segment.endOffset`

### Key Data Flow

```
Plan (hardcoded) → Exercise → genExerciseSegments() → Timeline (ExerciseSegment[])
                                                       ↓
Timer (1s interval) → Check elapsed time → Update secondsElapsedInSegment
                                          → Advance segment/exercise when complete
```

### Component Hierarchy

```
App (state + timer logic)
└── AppView (presentation switch)
    ├── ExerciseView (when running)
    │   ├── TimerCircle (visual countdown)
    │   └── SegmentIndicators (work/rest indicators)
    ├── ControlButtons (stop/next)
    └── ProgressBar (overall progress)
```

### Browser API Integration

- **Wake Lock API**: `useWakeLock` hook prevents screen sleep during exercises

  - Supports both standard `navigator.wakeLock` and Firefox's `mozWakeLock`
  - Acquired on start, released on stop

- **Web Audio API**: `utils/audio.ts` loads and plays WAV files

  - Uses AudioContext with unlock pattern for iOS/mobile compatibility
  - Sounds are lazily loaded on first user interaction via `ensureAudio()`

- **Speech Synthesis API**: `utils/speech.ts` announces exercise names
  - Filters for English voices, prefers female voices
  - Cancels previous utterances before speaking

### PWA Configuration

- Built with `vite-plugin-pwa`
- Prerendering enabled via `@preact/preset-vite`
- Manifest configured for "Eye Exercise App"
- Includes sound files and icons in service worker assets

## Code Conventions

### TypeScript

- Strict types defined in `src/types.ts` for Exercise, Plan, ExerciseSegment, and AppState
- Component props use explicit interface definitions (e.g., `ExerciseViewProps`)

### State Updates

- Use functional setState updates: `setState(currentState => { ... })`
- Always return new state objects, never mutate existing state
- Timer logic runs in setState callback to ensure it sees latest state

### Audio/Speech Initialization

- Audio context and speech must be initialized after user interaction (browser autoplay policy)
- `ensureAudio()` is called on first "Start" button click
- Check `typeof window === "undefined"` for SSR compatibility (prerendering)

## Apple Design Style Guide

This app is primarily used on iOS devices as a PWA. All UI should follow Apple's Human Interface Guidelines to create a native, polished experience.

### Typography

**Font Family:**

- Use system font stack: `-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", system-ui, sans-serif`
- This automatically uses SF Pro on Apple devices and falls back gracefully on other platforms
- Never use custom web fonts for body text (maintain native feel and performance)

**Type Scale:**

```css
--font-size-largeTitle: 34px; /* Page titles, major headings */
--font-size-title1: 28px; /* Section headers */
--font-size-title2: 22px; /* Subsection headers */
--font-size-title3: 20px; /* Group headers */
--font-size-headline: 17px; /* Emphasized content */
--font-size-body: 17px; /* Body text, buttons */
--font-size-callout: 16px; /* Secondary body text */
--font-size-subheadline: 15px; /* Tertiary content */
--font-size-footnote: 13px; /* Captions, footnotes */
--font-size-caption1: 12px; /* Additional info */
--font-size-caption2: 11px; /* Legal text */
```

**Font Weights:**

- Regular: 400
- Medium: 500 (for emphasized body text)
- Semibold: 600 (for buttons, labels)
- Bold: 700 (for headings only, use sparingly)

**Line Heights:**

- Use 1.2-1.3 for headlines
- Use 1.4-1.5 for body text
- Maintain comfortable reading rhythm

### Colors

**System Colors (Light Mode):**

```css
--color-label: rgba(0, 0, 0, 0.85); /* Primary text */
--color-secondaryLabel: rgba(0, 0, 0, 0.55); /* Secondary text */
--color-tertiaryLabel: rgba(0, 0, 0, 0.35); /* Tertiary text */
--color-quaternaryLabel: rgba(0, 0, 0, 0.18); /* Watermark text */

--color-fill: rgba(120, 120, 128, 0.2); /* Button fills */
--color-secondaryFill: rgba(120, 120, 128, 0.16);
--color-tertiaryFill: rgba(120, 120, 128, 0.12);

--color-separator: rgba(60, 60, 67, 0.36); /* Divider lines */
--color-background: #ffffff; /* Primary background */
--color-secondaryBackground: #f2f2f7; /* Grouped backgrounds */
--color-tertiaryBackground: #ffffff; /* Grouped table rows */
```

**System Colors (Dark Mode):**

```css
--color-label: rgba(255, 255, 255, 0.85);
--color-secondaryLabel: rgba(255, 255, 255, 0.55);
--color-tertiaryLabel: rgba(255, 255, 255, 0.35);
--color-quaternaryLabel: rgba(255, 255, 255, 0.18);

--color-fill: rgba(120, 120, 128, 0.36);
--color-secondaryFill: rgba(120, 120, 128, 0.32);
--color-tertiaryFill: rgba(120, 120, 128, 0.24);

--color-separator: rgba(84, 84, 88, 0.65);
--color-background: #000000;
--color-secondaryBackground: #1c1c1e;
--color-tertiaryBackground: #2c2c2e;
```

**Semantic Colors:**

```css
--color-blue: #007aff; /* Primary actions, links */
--color-green: #34c759; /* Success, positive actions */
--color-indigo: #5856d6; /* Alternative accent */
--color-orange: #ff9500; /* Warnings */
--color-pink: #ff2d55; /* Destructive actions */
--color-purple: #af52de; /* Creative actions */
--color-red: #ff3b30; /* Errors, destructive */
--color-teal: #5ac8fa; /* Active states */
--color-yellow: #ffcc00; /* Attention */
```

**Usage Guidelines:**

- Use `--color-blue` for primary action buttons (Start, Next)
- Use `--color-red` for destructive actions (Stop)
- Use semantic colors consistently (don't use red for success)
- Ensure 4.5:1 contrast ratio for text (WCAG AA)
- Ensure 3:1 contrast ratio for interactive elements

### Spacing & Layout

**Spacing Scale:**

```css
--space-4: 4px; /* Minimal spacing */
--space-8: 8px; /* Tight spacing */
--space-12: 12px; /* Compact spacing */
--space-16: 16px; /* Standard spacing */
--space-20: 20px; /* Comfortable spacing */
--space-24: 24px; /* Section spacing */
--space-32: 32px; /* Large spacing */
--space-40: 40px; /* Extra large spacing */
--space-48: 48px; /* Major section spacing */
```

**Layout Guidelines:**

- Use 16px (--space-16) as the default page margin on mobile
- Use 20px (--space-20) for spacing between major UI sections
- Use 8px (--space-8) for spacing within component groups
- Max content width: 600px (centered on larger screens)
- Respect safe areas (especially iPhone notch and home indicator)

**Safe Areas:**

```css
/* Account for iOS safe areas */
padding-top: env(safe-area-inset-top);
padding-right: env(safe-area-inset-right);
padding-bottom: env(safe-area-inset-bottom);
padding-left: env(safe-area-inset-left);
```

### Components

**Buttons:**

_Primary Button (Filled):_

```css
background: var(--color-blue);
color: white;
border: none;
border-radius: 10px; /* iOS uses 10px for standard buttons */
padding: 12px 20px;
font-size: 17px;
font-weight: 600;
min-height: 44px; /* Minimum touch target */
transition: opacity 0.2s ease;
```

_Destructive Button:_

```css
background: var(--color-red);
/* Same properties as primary */
```

_Secondary Button (Tinted):_

```css
background: rgba(0, 122, 255, 0.15); /* Tinted fill */
color: var(--color-blue);
/* Same structure as primary */
```

**Button States:**

- Hover: `opacity: 0.8`
- Active/Pressed: `opacity: 0.5` with 0.2s transition
- Disabled: `opacity: 0.3` and `cursor: not-allowed`

**Cards & Containers:**

```css
background: var(--color-secondaryBackground);
border-radius: 12px; /* iOS uses 12px for cards */
padding: 16px;
box-shadow: none; /* iOS rarely uses shadows in light mode */
```

**Dark Mode Cards:**

```css
background: var(--color-secondaryBackground);
/* Subtle border in dark mode for definition */
border: 0.5px solid var(--color-separator);
```

**Progress Indicators:**

- Use continuous animations (no steps)
- Height: 4px for thin bars, 8px for standard
- Border radius: Full (50% of height)
- Color: `--color-blue` or semantic color
- Background: `--color-tertiaryFill`

**Circular Progress:**

- Use SF Symbols style circular indicators
- Stroke width: 4-6px
- Cap: round
- Animate with easing: `cubic-bezier(0.4, 0.0, 0.2, 1)`

### Animations & Transitions

**Timing Functions:**

```css
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1); /* Standard easing */
--ease-out: cubic-bezier(0, 0, 0.2, 1); /* Deceleration */
--ease-in: cubic-bezier(0.4, 0, 1, 1); /* Acceleration */
--ease-standard: cubic-bezier(0.25, 0.1, 0.25, 1); /* Natural motion */
```

**Duration Guidelines:**

- Micro-interactions (button press): 100-200ms
- UI element transitions: 200-300ms
- View transitions: 300-400ms
- Complex animations: 400-600ms
- Never exceed 600ms (feels sluggish)

**Animation Principles:**

- Use subtle, purposeful motion
- Prefer opacity and transform over position changes
- Respect `prefers-reduced-motion` media query
- Avoid animating width/height (use scale instead)

**Example:**

```css
button {
  transition:
    opacity 0.2s var(--ease-out),
    transform 0.2s var(--ease-out);
}

button:active {
  opacity: 0.5;
  transform: scale(0.96);
}
```

### Accessibility

**Touch Targets:**

- Minimum: 44×44px (Apple requirement)
- Preferred: 48×48px for primary actions
- Ensure adequate spacing between targets (8px minimum)

**Text Accessibility:**

- Support Dynamic Type (respond to user font size preferences)
- Maintain contrast ratios: 4.5:1 for text, 3:1 for UI elements
- Use semantic HTML (`<button>`, `<header>`, etc.)

**VoiceOver Support:**

- Add `aria-label` for icon-only buttons
- Use `role` attributes appropriately
- Announce dynamic content changes with `aria-live`
- Ensure focus order matches visual order

**Reduced Motion:**

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Dark Mode

**Implementation:**

```css
@media (prefers-color-scheme: dark) {
  :root {
    --color-label: rgba(255, 255, 255, 0.85);
    --color-background: #000000;
    /* ... other dark mode variables */
  }
}
```

**Guidelines:**

- Support both light and dark modes
- Use semantic color variables (not hardcoded colors)
- Test all states in both modes
- Avoid pure white (#FFFFFF) on pure black (#000000) - too harsh
- Use elevated surfaces in dark mode (subtle borders/separators)

### iOS-Specific Considerations

**Status Bar:**

```html
<!-- In index.html -->
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<!-- Use "black-translucent" for full-screen apps -->
```

**Viewport:**

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
```

**Home Screen:**

```html
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-title" content="Eye Exercise" />
```

**Haptic Feedback (if implementing via library):**

- Light: For small UI changes
- Medium: For warnings, moderate actions
- Heavy: For errors, destructive actions

**Scroll Behavior:**

```css
/* Smooth momentum scrolling on iOS */
-webkit-overflow-scrolling: touch;
overscroll-behavior: contain;
```

### Design Checklist

When implementing or reviewing UI:

- [ ] Uses system font stack (`-apple-system`, SF Pro)
- [ ] Colors use CSS variables for light/dark mode
- [ ] All touch targets are minimum 44×44px
- [ ] Spacing follows 4px grid (4, 8, 12, 16, 20, 24, 32, 40, 48)
- [ ] Border radius: 10px (buttons), 12px (cards)
- [ ] Animations are subtle and respect `prefers-reduced-motion`
- [ ] Safe areas are respected (notch, home indicator)
- [ ] Contrast ratios meet WCAG AA (4.5:1 text, 3:1 UI)
- [ ] Semantic colors used appropriately (blue=primary, red=destructive)
- [ ] Interactive states defined (hover, active, disabled)
- [ ] Focus states visible for keyboard navigation
- [ ] aria-labels present for icon buttons
- [ ] Works in both light and dark mode

### References

- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/ios)
- [SF Symbols](https://developer.apple.com/sf-symbols/)
- [iOS Design Themes](https://developer.apple.com/design/human-interface-guidelines/ios/overview/themes/)
- [Color Guidelines](https://developer.apple.com/design/human-interface-guidelines/ios/visual-design/color/)
- [Typography Guidelines](https://developer.apple.com/design/human-interface-guidelines/ios/visual-design/typography/)
