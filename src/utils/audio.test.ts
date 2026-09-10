import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppState } from "../types";
import { ExerciseAudio } from "./audio";

import { FakeContext } from "../test/audioContext";

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

let audio: ExerciseAudio;
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(100_000);
  vi.stubGlobal("AudioContext", FakeContext);
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(1) })),
  );
  FakeContext.initialState = "running";
  audio = new ExerciseAudio();
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

describe("announcements on the session audio context", () => {
  it("plays successive automatic announcements using the context activated by Start", async () => {
    // Model Safari's activation boundary: only Start may resume the context;
    // media-element playback would be denied once the gesture is over.
    const media = vi.fn(() => {
      throw new Error("NotAllowedError");
    });
    vi.stubGlobal("Audio", media);
    FakeContext.initialState = "suspended";
    await audio.preload("./announcements/blink-often.mp3");
    await audio.prepare();
    const context = FakeContext.latest;
    context.resume.mockRejectedValue(new Error("No user gesture"));
    const fallback = vi.fn();
    await audio.playAnnouncement("./announcements/blink-often.mp3", fallback);
    vi.setSystemTime(160_000);
    audio.sync(exercise());
    await audio.playAnnouncement("./announcements/blink-slowly.mp3", fallback);
    vi.setSystemTime(220_000);
    await audio.playAnnouncement("./announcements/head-movement-clockwise.mp3", fallback);
    expect(FakeContext.latest).toBe(context);
    expect(media).not.toHaveBeenCalled();
    expect(context.resume).toHaveBeenCalledTimes(1);
    expect(fallback).not.toHaveBeenCalled();
    // Three voices plus all 19 scheduled work/rest cues, on one context.
    expect(context.sources).toHaveLength(22);
    expect(context.sources[0].start).toHaveBeenCalled();
    expect(context.sources[20].start).toHaveBeenCalled();
    expect(context.sources[21].start).toHaveBeenCalled();
  });

  it("shares pending downloads and decoded MP3s without moving work/rest cues", async () => {
    await audio.prepare();
    audio.sync(exercise());
    const context = FakeContext.latest;
    const fallback = vi.fn();
    const url = "./announcements/blink-slowly.mp3";
    await Promise.all([audio.preload(url), audio.playAnnouncement(url, fallback)]);
    await audio.playAnnouncement(url, fallback);
    expect(fetch).toHaveBeenCalledTimes(3); // two cues plus one MP3
    expect(context.decodeAudioData).toHaveBeenCalledTimes(3);
    expect(context.sources).toHaveLength(21);
    context.sources.slice(0, 19).forEach((source, index) => {
      expect(source.start).toHaveBeenCalledWith(13 + index * 3);
      expect(source.stop).toHaveBeenCalledTimes(1);
      expect(source.disconnect).not.toHaveBeenCalled();
    });
  });

  it("ignores an old download that completes after Next has announced a newer exercise", async () => {
    await audio.prepare();
    let finish!: (response: Response) => void;
    vi.mocked(fetch).mockReturnValueOnce(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const fallback = vi.fn();
    const old = audio.playAnnouncement("./announcements/blink-often.mp3", fallback);
    await audio.playAnnouncement("./announcements/blink-slowly.mp3", fallback);
    const context = FakeContext.latest;
    expect(context.sources).toHaveLength(1);
    finish({ ok: true, arrayBuffer: async () => new ArrayBuffer(1) } as Response);
    await old;
    expect(context.sources).toHaveLength(1);
    expect(context.sources[0].stop).not.toHaveBeenCalled();
    expect(fallback).not.toHaveBeenCalled();
  });

  it.each(["stop", "pause", "dispose"])("prevents a pending announcement after %s", async (action) => {
    await audio.prepare();
    const state = { ...exercise(), timeline: [exercise().timeline[0]] };
    audio.sync(state);
    let fail!: (error: Error) => void;
    vi.mocked(fetch).mockReturnValueOnce(
      new Promise((_, reject) => {
        fail = reject;
      }),
    );
    const fallback = vi.fn();
    const pending = audio.playAnnouncement("./announcements/blink-often.mp3", fallback);
    if (action === "dispose") audio.dispose();
    else audio.sync(action === "stop" ? null : { ...state, isPaused: true });
    fail(new Error("late failure"));
    await pending;
    expect(FakeContext.latest.sources).toHaveLength(0);
    expect(fallback).not.toHaveBeenCalled();
  });

  it("falls back on a real decode failure and permits retry", async () => {
    await audio.prepare();
    const context = FakeContext.latest;
    context.decodeAudioData.mockRejectedValueOnce(new Error("bad MP3"));
    const fallback = vi.fn();
    const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
    await audio.playAnnouncement("./announcements/blink-often.mp3", fallback);
    expect(fallback).toHaveBeenCalledTimes(1);
    await audio.playAnnouncement("./announcements/blink-often.mp3", fallback);
    expect(fallback).toHaveBeenCalledTimes(1);
    expect(context.sources).toHaveLength(1);
    warning.mockRestore();
  });

  it("waits for the gesture's pending resume before playing the first announcement", async () => {
    await audio.prepare();
    const context = FakeContext.latest;
    context.state = "suspended";
    let resumed!: () => void;
    context.resume.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resumed = () => {
            context.state = "running";
            resolve();
          };
        }),
    );
    const preparing = audio.prepare();
    const fallback = vi.fn();
    const speaking = audio.playAnnouncement("./announcements/blink-often.mp3", fallback);
    await audio.preload("./announcements/blink-often.mp3");
    expect(context.sources).toHaveLength(0);
    resumed();
    await Promise.all([preparing, speaking]);
    expect(context.sources).toHaveLength(1);
    expect(fallback).not.toHaveBeenCalled();
  });
});
