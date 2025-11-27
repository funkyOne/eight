export type SoundHandle = {
  play: () => void;
};

// Shared AudioContext for all audio playback (critical for iOS)
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

function unlock(context: AudioContext) {
  // Create and play empty buffer to unlock audio context on iOS
  const buffer = context.createBuffer(1, 1, 22050);
  const source = context.createBufferSource();
  source.buffer = buffer;
  source.connect(context.destination);
  source.start(0);
}

/**
 * Load an audio file as an AudioBuffer
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

function createSoundHandle(buffer: AudioBuffer): SoundHandle {
  return {
    play: function () {
      playAudioBuffer(buffer);
    },
  };
}

export async function load(fileUrls: string[]): Promise<SoundHandle[]> {
  const soundHandles = await Promise.all(
    fileUrls.map(async (url) => {
      const buffer = await loadAudioBuffer(url);
      return createSoundHandle(buffer);
    })
  );
  return soundHandles;
}
