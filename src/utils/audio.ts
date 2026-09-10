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

/** One user-activated context for both scheduled cues and prerecorded speech. */
export class ExerciseAudio {
  private context: AudioContext | undefined;
  private buffers: AudioBuffer[] | undefined;
  private loading: Promise<void> | undefined;
  private state: AppState | null = null;
  private sources = new Set<AudioBufferSourceNode>();
  private disposed = false;
  private downloads = new Map<string, Promise<ArrayBuffer>>();
  private decoded = new Map<string, Promise<AudioBuffer>>();
  private resuming: Promise<void> = Promise.resolve();
  private announcement: AudioBufferSourceNode | undefined;
  private announcementRequest = 0;

  /** Download on mount without creating or activating a browser audio context. */
  async preload(url: string): Promise<void> {
    await this.download(url);
    if (this.context && !this.disposed) await this.loadBuffer(url);
  }

  private download(url: string): Promise<ArrayBuffer> {
    let pending = this.downloads.get(url);
    if (!pending) {
      pending = fetch(url)
        .then((response) => {
          if (!response.ok) throw new Error(`Failed to load audio: ${url}`);
          return response.arrayBuffer();
        })
        .catch((error: unknown) => {
          this.downloads.delete(url);
          throw error;
        });
      this.downloads.set(url, pending);
    }
    return pending;
  }

  private loadBuffer(url: string): Promise<AudioBuffer> {
    let pending = this.decoded.get(url);
    if (!pending) {
      const context = this.context;
      if (!context) return Promise.reject(new Error("Audio has not been activated"));
      pending = this.download(url)
        .then((bytes) => context.decodeAudioData(bytes.slice(0)))
        .catch((error: unknown) => {
          this.decoded.delete(url);
          throw error;
        });
      this.decoded.set(url, pending);
    }
    return pending;
  }

  stopAnnouncement(): void {
    this.announcementRequest++;
    this.announcement?.stop();
    this.announcement?.disconnect();
    this.announcement = undefined;
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
  }

  async playAnnouncement(url: string | undefined, fallback: () => void): Promise<void> {
    this.stopAnnouncement();
    if (this.disposed) return;
    const request = this.announcementRequest;
    if (url) {
      try {
        const [buffer] = await Promise.all([this.loadBuffer(url), this.resuming]);
        if (this.disposed || request !== this.announcementRequest) return;
        const context = this.context!;
        if (context.state !== "running") throw new Error(`Audio context is ${context.state}`);
        const source = context.createBufferSource();
        source.buffer = buffer;
        source.connect(context.destination);
        source.onended = () => {
          source.disconnect();
          if (this.announcement === source) this.announcement = undefined;
        };
        this.announcement = source;
        source.start();
        return;
      } catch (error) {
        if (this.disposed || request !== this.announcementRequest) return;
        console.warn(`Announcement failed: ${url}; using speech fallback`, error);
      }
    }
    if (!this.disposed && request === this.announcementRequest) fallback();
  }

  /** Invoke synchronously from Start/Resume so iOS permits audio playback. */
  async prepare(): Promise<void> {
    if (typeof window === "undefined" || this.disposed) return;
    if (!this.context) {
      this.context = new (window.AudioContext || window.webkitAudioContext)();
      this.context.addEventListener("statechange", this.reschedule);
    }
    const context = this.context;
    // Resume before any await, preserving the user activation.
    this.resuming = context.state !== "running" ? context.resume() : Promise.resolve();
    if (!this.loading) {
      this.loading = Promise.all(cueUrls.map((url) => this.loadBuffer(url)))
        .then((buffers) => {
          this.buffers = buffers;
          this.reschedule();
        })
        .catch((error: unknown) => {
          this.loading = undefined;
          throw error;
        });
    }
    await Promise.all([this.resuming, this.loading]);
  }

  sync(state: AppState | null): void {
    const previous = this.state;
    this.state = state;
    if (!state || state.isPaused || previous?.timeline !== state.timeline) this.stopAnnouncement();
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
    this.stopAnnouncement();
    this.cancel();
    this.context?.removeEventListener("statechange", this.reschedule);
    void this.context?.close().catch((error: unknown) => console.warn("Audio cleanup failed", error));
  }
}
