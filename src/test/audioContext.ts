import { vi } from "vitest";

export class FakeSource {
  buffer: AudioBuffer | null = null;
  connect = vi.fn();
  disconnect = vi.fn();
  start = vi.fn();
  stop = vi.fn();
  onended: (() => void) | null = null;
}

export class FakeContext extends EventTarget {
  static latest: FakeContext;
  static initialState = "running";
  state = FakeContext.initialState;
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
