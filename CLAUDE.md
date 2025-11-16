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
