declare global {
  interface Window {
    AudioContext: typeof AudioContext;
    webkitAudioContext: typeof AudioContext;
  }
}

export type SoundHandle = {
  play: () => void;
};

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
  let audioContext = new (window.AudioContext || window.webkitAudioContext)();

  unlock(audioContext);

  const soundHandles = await Promise.all(fileUrls.map((url) => loadSound(url, audioContext)));
  return soundHandles;
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

  // by checking the play state after some time, we know if we're really unlocked
  // setTimeout(function () {
  //   if (source.playbackState === source.PLAYING_STATE || source.playbackState === source.FINISHED_STATE) {
  //     // Hide the unmute button if the context is unlocked.
  //     unmute.style.display = "none";
  //   }
  // }, 0);
}
