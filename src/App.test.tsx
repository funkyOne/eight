import { act, fireEvent, render, screen } from "@testing-library/preact";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AppViewProps } from "./components/AppView";
import App from "./App";

const mocks = vi.hoisted(() => ({
  prepare: vi.fn(async () => {}),
  sync: vi.fn(),
  dispose: vi.fn(),
  announce: vi.fn(),
  praise: vi.fn(),
  releaseWakeLock: vi.fn(),
  requestWakeLock: vi.fn(),
}));
vi.mock("./utils/audio", () => ({
  TransitionAudio: class {
    prepare = mocks.prepare;
    sync = mocks.sync;
    dispose = mocks.dispose;
  },
}));
vi.mock("./utils/announcements", () => ({
  announceExercise: mocks.announce,
  speakPraise: mocks.praise,
  preloadAnnouncements: vi.fn(),
}));
vi.mock("./hooks/useWakeLock", () => ({
  useWakeLock: () => ({
    requestWakeLock: mocks.requestWakeLock,
    releaseWakeLock: mocks.releaseWakeLock,
  }),
}));
vi.mock("./components/AppView", () => ({
  default: (props: AppViewProps) => (
    <>
      <button onClick={props.handleStart}>Start</button>
      <button onClick={props.handleNext}>Next</button>
      <button onClick={props.handlePause}>Pause</button>
      <button onClick={props.handleStop}>Stop</button>
      <output>
        {props.exercise
          ? `${props.exercise.exercise.name}|${props.exercise.currentSegmentIndex}|${props.exercise.elapsed}|${props.isPaused}`
          : "idle"}
      </output>
    </>
  ),
}));

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(100_000);
  vi.clearAllMocks();
});
afterEach(() => {
  vi.useRealTimers();
});
const click = (name: string): void => {
  fireEvent.click(screen.getByText(name));
};
const advance = (ms: number): void => {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
};
const output = (): string | null => screen.getByRole("status").textContent;

describe("exercise clock and audio lifecycle", () => {
  it("uses the same exercise start and timeline for UI and audio, including an off-second Next", () => {
    render(<App />);
    click("Start");
    advance(1250);
    click("Next");
    expect(output()).toBe("Blink Slowly|0|0|false");
    advance(2950);
    expect(output()).toBe("Blink Slowly|0|2|false");
    advance(50);
    expect(output()).toBe("Blink Slowly|1|3|false");
    const state = mocks.sync.mock.lastCall![0];
    expect(state.startedAt).toBe(101250);
    expect(state.timeline[state.segmentIndex].startOffset).toBe(3000);
    advance(3000);
    expect(output()).toBe("Blink Slowly|2|6|false");
  });

  it("catches up to the current segment in one tick after a long UI stall", () => {
    render(<App />);
    click("Start");
    click("Next");
    vi.setSystemTime(114_000);
    advance(50);
    expect(output()).toBe("Blink Slowly|4|14|false");
    expect(mocks.announce).toHaveBeenCalledTimes(2);
  });

  it("preserves exercise boundaries across a delayed automatic transition", () => {
    render(<App />);
    click("Start");
    vi.setSystemTime(167_000);
    advance(50);
    expect(output()).toBe("Blink Slowly|2|7|false");
    expect(mocks.sync.mock.lastCall![0].startedAt).toBe(160_000);
    expect(mocks.announce).toHaveBeenLastCalledWith("Blink Slowly");
  });

  it("freezes while paused and shifts the audio and UI start equally on resume", () => {
    render(<App />);
    click("Start");
    click("Next");
    advance(4000);
    click("Pause");
    expect(mocks.sync.mock.lastCall![0].isPaused).toBe(true);
    advance(10000);
    expect(output()).toBe("Blink Slowly|1|4|true");
    click("Pause");
    expect(mocks.sync.mock.lastCall![0].startedAt).toBe(110_000);
    advance(2000);
    expect(output()).toBe("Blink Slowly|2|6|false");
  });

  it("clears the timer and scheduled audio on stop and can restart", () => {
    const { unmount } = render(<App />);
    click("Start");
    click("Stop");
    expect(output()).toBe("idle");
    expect(mocks.sync).toHaveBeenLastCalledWith(null);
    expect(vi.getTimerCount()).toBe(0);
    click("Start");
    advance(1000);
    expect(output()).toBe("Blink Often|0|1|false");
    unmount();
    expect(mocks.dispose).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("finishes once, releases the wake lock and leaves no running timer", () => {
    render(<App />);
    click("Start");
    vi.setSystemTime(3_700_000);
    advance(50);
    expect(output()).toBe("idle");
    expect(mocks.sync).toHaveBeenLastCalledWith(null);
    expect(mocks.releaseWakeLock).toHaveBeenCalledTimes(1);
    expect(mocks.praise).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
    advance(5000);
    expect(mocks.praise).toHaveBeenCalledTimes(1);
  });
});
