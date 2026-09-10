import { AppState } from "../types";

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

const cueUrls = [
  "./sounds/220174__gameaudio__spacey-loose.wav", // rest
  "./sounds/220202__gameaudio__teleport-casual.wav", // work
];

/** One context and two decoded buffers, reused for the whole session. */
export class TransitionAudio {
  private context: AudioContext | undefined;
  private buffers: AudioBuffer[] | undefined;
  private loading: Promise<void> | undefined;
  private state: AppState | null = null;
  private sources = new Set<AudioBufferSourceNode>();
  private disposed = false;

  /** Invoke synchronously from Start/Resume so iOS permits audio playback. */
  async prepare(): Promise<void> {
    if (typeof window === "undefined" || this.disposed) return;
    if (!this.context) {
      this.context = new (window.AudioContext || window.webkitAudioContext)();
      this.context.addEventListener("statechange", this.reschedule);
    }
    const context = this.context;
    // Resume before any await, preserving the user activation.
    const resuming = context.state !== "running" ? context.resume() : Promise.resolve();
    if (!this.loading) {
      this.loading = Promise.all(
        cueUrls.map(async (url) => {
          const response = await fetch(url);
          if (!response.ok) throw new Error(`Failed to load transition audio: ${url}`);
          return context.decodeAudioData(await response.arrayBuffer());
        }),
      )
        .then((buffers) => {
          this.buffers = buffers;
          this.reschedule();
        })
        .catch((error: unknown) => {
          this.loading = undefined;
          throw error;
        });
    }
    await Promise.all([resuming, this.loading]);
  }

  sync(state: AppState | null): void {
    const previous = this.state;
    this.state = state;
    // UI second/segment updates must not cancel or duplicate scheduled cues.
    if (
      previous?.timeline === state?.timeline &&
      previous?.startedAt === state?.startedAt &&
      previous?.isPaused === state?.isPaused
    )
      return;
    this.reschedule();
  }

  private cancel(): void {
    for (const source of this.sources) {
      source.stop();
      source.disconnect();
    }
    this.sources.clear();
  }

  private reschedule = (): void => {
    this.cancel();
    const { context, buffers, state } = this;
    if (this.disposed || !context || context.state !== "running" || !buffers || !state || state.isPaused) return;
    const now = Date.now();
    const audioNow = context.currentTime;
    // Schedule the whole exercise on the audio rendering clock. JavaScript/UI
    // delays within an exercise cannot delay its remaining work/rest cues.
    for (const segment of state.timeline.slice(1)) {
      const delay = (state.startedAt + segment.startOffset - now) / 1000;
      // After interruption, discard elapsed cues instead of playing a backlog.
      if (delay < 0) continue;
      const source = context.createBufferSource();
      source.buffer = buffers[segment.type === "r" ? 0 : 1];
      source.connect(context.destination);
      source.onended = () => {
        source.disconnect();
        this.sources.delete(source);
      };
      this.sources.add(source);
      source.start(audioNow + delay);
      // A cue must never spill into the following segment.
      source.stop(audioNow + delay + Math.min(source.buffer.duration, segment.duration));
    }
  };

  dispose(): void {
    this.disposed = true;
    this.state = null;
    this.cancel();
    this.context?.removeEventListener("statechange", this.reschedule);
    void this.context?.close().catch((error: unknown) => console.warn("Audio cleanup failed", error));
  }
}
