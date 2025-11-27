export type SoundHandle = {
  play: () => void;
};

// Shared AudioContext for MP3 announcements (critical for iOS)
// HTMLAudioElement works fine for sounds triggered during user interaction,
// but announcements need AudioContext since they play from setInterval
let sharedAudioContext: AudioContext | null = null;

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

/**
 * Get or create the shared AudioContext
 * Must be called from a user interaction handler to work on iOS
 */
export function getAudioContext(): AudioContext {
  if (!sharedAudioContext) {
    sharedAudioContext = new (window.AudioContext || window.webkitAudioContext)();
    unlock(sharedAudioContext);
  }
  return sharedAudioContext;
}

/**
 * Initialize the AudioContext (call this during user interaction)
 */
export function initAudioContext(): void {
  getAudioContext();
}

function unlock(context: AudioContext) {
  // Create and play empty buffer to unlock audio context on iOS
  const buffer = context.createBuffer(1, 1, 22050);
  const source = context.createBufferSource();
  source.buffer = buffer;
  source.connect(context.destination);
  source.start(0);
}

/**
 * Load an audio file as an AudioBuffer (for use with AudioContext)
 */
export async function loadAudioBuffer(url: string): Promise<AudioBuffer> {
  const audioContext = getAudioContext();
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return audioContext.decodeAudioData(arrayBuffer);
}

/**
 * Play an AudioBuffer through the shared AudioContext
 */
export function playAudioBuffer(buffer: AudioBuffer): void {
  const audioContext = getAudioContext();
  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.connect(audioContext.destination);
  source.start(0);
}

// HTMLAudioElement-based sounds (for rest/work sounds triggered during user interaction)
function createSoundHandle(audio: HTMLAudioElement): SoundHandle {
  return {
    play: function () {
      // Reset to beginning and play
      audio.currentTime = 0;
      audio.play().catch((error) => {
        console.warn("Failed to play sound:", error);
      });
    },
  };
}

async function loadSound(url: string): Promise<SoundHandle> {
  const audio = new Audio(url);
  audio.preload = "auto";

  return new Promise((resolve, reject) => {
    audio.addEventListener(
      "canplaythrough",
      () => {
        resolve(createSoundHandle(audio));
      },
      { once: true }
    );
    audio.addEventListener(
      "error",
      () => {
        reject(new Error(`Failed to load sound: ${url}`));
      },
      { once: true }
    );

    // Start loading
    audio.load();
  });
}

export async function load(fileUrls: string[]): Promise<SoundHandle[]> {
  // Also initialize AudioContext here since this is called during user interaction
  initAudioContext();
  const soundHandles = await Promise.all(fileUrls.map((url) => loadSound(url)));
  return soundHandles;
}
