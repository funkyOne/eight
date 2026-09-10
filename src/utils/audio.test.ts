import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppState } from "../types";
import { TransitionAudio } from "./audio";

class FakeSource {
  buffer: AudioBuffer | null = null;
  connect = vi.fn();
  disconnect = vi.fn();
  start = vi.fn();
  stop = vi.fn();
  onended: (() => void) | null = null;
}

class FakeContext extends EventTarget {
  static latest: FakeContext;
  state = "running";
  currentTime = 10;
  destination = {};
  sources: FakeSource[] = [];
  decodeAudioData = vi.fn(async () => ({ duration: 1 }));
  resume = vi.fn(async () => {
    this.state = "running";
    this.dispatchEvent(new Event("statechange"));
  });
  close = vi.fn(async () => {});
  constructor() {
    super();
    FakeContext.latest = this;
  }
  createBufferSource(): FakeSource {
    const source = new FakeSource();
    this.sources.push(source);
    return source;
  }
}

function exercise(startedAt = Date.now()): AppState {
  return {
    index: 1,
    startedAt,
    isPaused: false,
    segmentIndex: 0,
    secondsElapsedInSegment: 0,
    timeline: Array.from({ length: 20 }, (_, index) => ({
      type: index % 2 === 0 ? "w" : "r",
      startOffset: index * 3000,
      endOffset: (index + 1) * 3000,
      duration: 3,
    })),
  };
}

let audio: TransitionAudio;
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(100_000);
  vi.stubGlobal("AudioContext", FakeContext);
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(1) })),
  );
  audio = new TransitionAudio();
});
afterEach(() => {
  audio.dispose();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("work/rest audio schedule", () => {
  it("schedules every repetition ahead of time, alternating cached buffers on exact boundaries", async () => {
    await audio.prepare();
    audio.sync(exercise());
    const context = FakeContext.latest;
    expect(context.sources).toHaveLength(19);
    context.sources.forEach((source, index) => {
      expect(source.start).toHaveBeenCalledWith(10 + (index + 1) * 3);
      expect(source.stop).toHaveBeenCalledWith(11 + (index + 1) * 3);
      expect(source.buffer).toBe(context.sources[index % 2].buffer);
    });
    expect(context.sources[0].buffer).not.toBe(context.sources[1].buffer);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(context.decodeAudioData).toHaveBeenCalledTimes(2);
  });

  it("does not replay or move cues when UI callbacks arrive late", async () => {
    await audio.prepare();
    const state = exercise();
    audio.sync(state);
    const context = FakeContext.latest;
    vi.setSystemTime(Date.now() + 14_000);
    audio.sync({ ...state, segmentIndex: 4, secondsElapsedInSegment: 14 });
    expect(context.sources).toHaveLength(19);
    expect(context.sources[4].start).toHaveBeenCalledTimes(1);
    expect(context.sources[4].start).toHaveBeenCalledWith(25);
    expect(context.sources[0].stop).toHaveBeenCalledTimes(1);
  });

  it("cancels on pause and resumes with only the remaining boundaries shifted by the pause", async () => {
    await audio.prepare();
    const state = exercise();
    audio.sync(state);
    const context = FakeContext.latest;
    vi.setSystemTime(104_000);
    audio.sync({ ...state, isPaused: true, pausedAt: Date.now() });
    expect(context.sources.every((source) => source.stop.mock.calls.length === 2)).toBe(true);
    expect(context.sources.every((source) => source.disconnect.mock.calls.length === 1)).toBe(true);
    vi.setSystemTime(114_000);
    context.currentTime = 24;
    audio.sync({ ...state, startedAt: state.startedAt + 10_000 });
    expect(context.sources).toHaveLength(37);
    expect(context.sources[19].start).toHaveBeenCalledWith(26); // work, 2s after resume
    expect(context.sources[19].buffer).toBe(context.sources[1].buffer);
    await audio.prepare();
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(context.sources).toHaveLength(37);
  });

  it("cancels old cues on next, stop, and disposal", async () => {
    await audio.prepare();
    audio.sync(exercise());
    const context = FakeContext.latest;
    audio.sync({ ...exercise(), index: 2, timeline: [{ type: "w", startOffset: 0, endOffset: 15000, duration: 15 }] });
    expect(context.sources.every((source) => source.stop.mock.calls.length === 2)).toBe(true);
    audio.sync(exercise());
    audio.sync(null);
    expect(context.sources.every((source) => source.disconnect.mock.calls.length === 1)).toBe(true);
    audio.sync(exercise());
    audio.dispose();
    expect(context.sources.every((source) => source.disconnect.mock.calls.length === 1)).toBe(true);
    expect(context.close).toHaveBeenCalled();
  });

  it("rebuilds future cues after an iOS audio interruption without queuing elapsed sounds", async () => {
    await audio.prepare();
    audio.sync(exercise());
    const context = FakeContext.latest;
    context.state = "interrupted";
    context.dispatchEvent(new Event("statechange"));
    expect(context.sources.every((source) => source.disconnect.mock.calls.length === 1)).toBe(true);
    vi.setSystemTime(110_000);
    context.currentTime = 12;
    await audio.prepare();
    expect(context.resume).toHaveBeenCalledTimes(1);
    expect(context.sources).toHaveLength(35);
    expect(context.sources[19].start).toHaveBeenCalledWith(14); // next boundary at elapsed 12s
  });

  it("does not schedule stale exercise cues if loading finishes after stop", async () => {
    let finish!: (response: Response) => void;
    // Use one shared deferred response for both files.
    const response = new Promise<Response>((resolve) => {
      finish = resolve;
    });
    vi.mocked(fetch).mockReturnValue(response);
    const preparing = audio.prepare();
    audio.sync(exercise());
    audio.sync(null);
    finish({ ok: true, arrayBuffer: async () => new ArrayBuffer(1) } as Response);
    await preparing;
    expect(FakeContext.latest.sources).toHaveLength(0);
  });

  it("disconnects finished nodes", async () => {
    await audio.prepare();
    audio.sync(exercise());
    const source = FakeContext.latest.sources[0];
    source.onended?.();
    audio.sync(null);
    expect(source.disconnect).toHaveBeenCalledTimes(1);
    expect(source.stop).toHaveBeenCalledTimes(1);
  });
});
