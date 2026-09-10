import { act, fireEvent, render, screen } from "@testing-library/preact";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import App from "./App";
import { FakeContext } from "./test/audioContext";
import { setAnnouncementMode } from "./utils/announcements";

const speech = vi.hoisted(() => ({ speak: vi.fn(), speakPraise: vi.fn() }));
vi.mock("./utils/speech", () => speech);
vi.mock("./hooks/useWakeLock", () => ({
  useWakeLock: () => ({ requestWakeLock: vi.fn(), releaseWakeLock: vi.fn() }),
}));

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(100_000);
  vi.clearAllMocks();
  localStorage.clear();
  setAnnouncementMode("mp3");
  FakeContext.initialState = "suspended";
  vi.stubGlobal("AudioContext", FakeContext);
  vi.stubGlobal(
    "Audio",
    vi.fn(() => {
      throw new Error("NotAllowedError: requires user gesture");
    }),
  );
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(1) })),
  );
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const click = async (text: string): Promise<void> => {
  await act(async () => {
    fireEvent.click(screen.getByText(text));
    await vi.advanceTimersByTimeAsync(0);
  });
};
const advance = async (ms: number): Promise<void> => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
};
const voiceCount = (): number =>
  FakeContext.latest.sources.filter((source) => source.start.mock.calls[0]?.length === 0).length;

it("plays MP3s at successive automatic boundaries after one Start activation, then handles Next and completion", async () => {
  const { unmount } = render(<App />);
  await click("Tap anywhere to start");
  const context = FakeContext.latest;
  expect(context.resume).toHaveBeenCalledTimes(1);
  expect(voiceCount()).toBe(1);
  context.resume.mockRejectedValue(new Error("No further user gesture"));

  await advance(60000);
  expect(screen.getByText("Blink Slowly")).toBeInTheDocument();
  expect(voiceCount()).toBe(2);
  await advance(60000);
  expect(screen.getByText("Clockwise")).toBeInTheDocument();
  expect(voiceCount()).toBe(3);
  await advance(15000);
  expect(screen.getByText("Counterclockwise")).toBeInTheDocument();
  expect(voiceCount()).toBe(4);
  expect(context.resume).toHaveBeenCalledTimes(1);

  await click("Next");
  expect(screen.getByText("Side to Side")).toBeInTheDocument();
  expect(voiceCount()).toBe(5);
  await advance(15000);
  expect(screen.getByText("Up and Down")).toBeInTheDocument();
  expect(voiceCount()).toBe(6);

  vi.setSystemTime(3_700_000);
  await advance(50);
  expect(screen.getByText("Tap anywhere to start")).toBeInTheDocument();
  expect(voiceCount()).toBe(7); // final MP3 praise uses the same context too
  expect(FakeContext.latest).toBe(context);
  expect(Audio).not.toHaveBeenCalled();
  expect(speech.speak).not.toHaveBeenCalled();
  expect(speech.speakPraise).not.toHaveBeenCalled();
  unmount();
});

it("keeps the selected text-to-speech mode", async () => {
  localStorage.setItem("eye-exercise-settings", JSON.stringify({ voiceMode: "tts" }));
  const { unmount } = render(<App />);
  await click("Tap anywhere to start");
  await advance(60000);
  expect(speech.speak).toHaveBeenNthCalledWith(1, "Blink Often");
  expect(speech.speak).toHaveBeenNthCalledWith(2, "Blink Slowly");
  expect(voiceCount()).toBe(0);
  unmount();
});
