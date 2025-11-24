import { speak, speakPraise as ttsSpeakPraise } from "./speech";

/**
 * Configuration for announcement system
 * Set to 'mp3' to use pre-recorded MP3 files, 'tts' to use text-to-speech
 */
export type AnnouncementMode = "mp3" | "tts";

let announcementMode: AnnouncementMode = "mp3";

/**
 * Set the announcement mode
 */
export function setAnnouncementMode(mode: AnnouncementMode): void {
  announcementMode = mode;
}

/**
 * Get the current announcement mode
 */
export function getAnnouncementMode(): AnnouncementMode {
  return announcementMode;
}

/**
 * Maps exercise names to their corresponding MP3 file names
 */
const exerciseNameToMp3: Record<string, string> = {
  "Blink Often": "blink-often.mp3",
  "Blink Slowly": "blink-slowly.mp3",
  "Head Movement: Clockwise": "head-movement-clockwise.mp3",
  "Head Movement: Counterclockwise": "head-movement-counterclockwise.mp3",
  "Head Movement: Side to Side": "head-movement-side-to-side.mp3",
  "Head Movement: Up and Down": "head-movement-up-down.mp3",
  "Eye Movement: Left and Right": "eye-movement-left-right.mp3",
  "Eye Movement: Up and Down": "eye-movement-updown.mp3",
  "Eye Movement: Figure 8": "eye-movement-eight.mp3",
  "Eye Movement: Random Direction": "eye-movement-random-direction.mp3",
  "Squeezing Eyes Shut": "squeezing-eyes-shut.mp3",
  "Eyes Shut Movements": "eyes-shut-movements.mp3",
  "Change Focus": "change-focus.mp3",
  "Temple Massage": "temple-massage.mp3",
  "Eyes Palming": "eyes-palming.mp3",
};

/**
 * Cache for loaded audio elements
 */
const audioCache = new Map<string, HTMLAudioElement>();

/**
 * Base path for announcement MP3 files
 */
const ANNOUNCEMENTS_BASE_PATH = "./announcements/";

/**
 * Load an MP3 file and cache it
 */
async function loadMp3(filename: string): Promise<HTMLAudioElement> {
  if (audioCache.has(filename)) {
    return audioCache.get(filename)!;
  }

  const audio = new Audio(`${ANNOUNCEMENTS_BASE_PATH}${filename}`);
  
  // Preload the audio
  audio.preload = "auto";
  
  // Cache the audio element
  audioCache.set(filename, audio);
  
  // Wait for the audio to be ready
  return new Promise((resolve, reject) => {
    audio.addEventListener("canplaythrough", () => resolve(audio), { once: true });
    audio.addEventListener("error", () => reject(new Error(`Failed to load ${filename}`)), { once: true });
    
    // Start loading
    audio.load();
  });
}

/**
 * Play an MP3 announcement
 */
async function playMp3(filename: string): Promise<void> {
  try {
    const audio = await loadMp3(filename);
    
    // Stop any currently playing announcement
    audioCache.forEach((cachedAudio) => {
      if (!cachedAudio.paused) {
        cachedAudio.pause();
        cachedAudio.currentTime = 0;
      }
    });
    
    // Play the new announcement
    audio.currentTime = 0;
    await audio.play();
  } catch (error) {
    console.warn(`Failed to play MP3 ${filename}, falling back to TTS:`, error);
    throw error;
  }
}

/**
 * Announce an exercise name using MP3 or TTS based on current mode
 */
export async function announceExercise(exerciseName: string): Promise<void> {
  if (announcementMode === "mp3") {
    const mp3Filename = exerciseNameToMp3[exerciseName];
    
    if (mp3Filename) {
      try {
        await playMp3(mp3Filename);
        return;
      } catch (error) {
        // Fall back to TTS if MP3 fails
        console.warn(`MP3 announcement failed for "${exerciseName}", using TTS fallback`);
      }
    } else {
      console.warn(`No MP3 file found for exercise "${exerciseName}", using TTS fallback`);
    }
  }
  
  // Use TTS as fallback or if mode is 'tts'
  speak(exerciseName);
}

/**
 * Speak praise using TTS (no MP3 version available)
 */
export function speakPraise(): void {
  ttsSpeakPraise();
}

/**
 * Preload announcement MP3 files for offline use
 */
export async function preloadAnnouncements(orderedExerciseNames?: string[]): Promise<void> {
  if (typeof window === "undefined") return;
  if (announcementMode !== "mp3") return;
  
  const filenames = orderedExerciseNames 
    ? orderedExerciseNames.map(name => exerciseNameToMp3[name]).filter(Boolean)
    : Object.values(exerciseNameToMp3);
  
  // Load MP3 files sequentially
  for (const filename of filenames) {
    try {
      await loadMp3(filename);
    } catch (error) {
      console.warn(`Failed to preload ${filename}:`, error);
    }
  }
}

