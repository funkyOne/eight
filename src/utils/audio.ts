declare global {
  interface Window {
    AudioContext: typeof AudioContext;
    webkitAudioContext: typeof AudioContext;
  }
}

export type SoundHandle = {
  play: () => void;
};

// Shared AudioContext for all audio playback (critical for iOS)
let sharedAudioContext: AudioContext | null = null;

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
 * Resume the AudioContext if it's suspended (iOS requirement)
 */
export async function ensureAudioContextResumed(): Promise<void> {
  if (sharedAudioContext && sharedAudioContext.state === "suspended") {
    await sharedAudioContext.resume();
  }
}

function createSoundHandle(buffer: AudioBuffer, audioContext: AudioContext): SoundHandle {
  return {
    play: function () {
      let source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      source.start(0);
    },
  };
}

async function loadSound(url: string, audioContext: AudioContext): Promise<SoundHandle> {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = await audioContext.decodeAudioData(arrayBuffer);
  return createSoundHandle(buffer, audioContext);
}

export async function load(fileUrls: string[]): Promise<SoundHandle[]> {
  const audioContext = getAudioContext();
  const soundHandles = await Promise.all(fileUrls.map((url) => loadSound(url, audioContext)));
  return soundHandles;
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

function unlock(context: AudioContext) {
  console.log("unlocking");
  // create empty buffer and play it
  var buffer = context.createBuffer(1, 1, 22050);
  var source = context.createBufferSource();
  source.buffer = buffer;
  source.connect(context.destination);

  // play the file. noteOn is the older version of start()
  source.start ? source.start(0) : (source as any).noteOn(0);
}
