export type SoundHandle = {
  play: () => void;
};

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
  const soundHandles = await Promise.all(fileUrls.map((url) => loadSound(url)));
  return soundHandles;
}
