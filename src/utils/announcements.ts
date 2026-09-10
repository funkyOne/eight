import { speak, speakPraise as ttsSpeakPraise } from "./speech";
import { getRandomPraiseClip, PraiseClip } from "./praise";
import { ExerciseAudio } from "./audio";

export type AnnouncementMode = "mp3" | "tts";
let announcementMode: AnnouncementMode = "mp3";
let selectedPraiseClip: PraiseClip | null = null;

function ensurePraiseClip(): PraiseClip {
  if (!selectedPraiseClip) selectedPraiseClip = getRandomPraiseClip();
  return selectedPraiseClip;
}

export function setAnnouncementMode(mode: AnnouncementMode): void {
  announcementMode = mode;
}

export function getAnnouncementMode(): AnnouncementMode {
  return announcementMode;
}

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

function announcementUrl(filename: string): string {
  return `./announcements/${filename}`;
}

export function announceExercise(exerciseName: string, audio: ExerciseAudio): Promise<void> {
  const filename = exerciseNameToMp3[exerciseName];
  const url = announcementMode === "mp3" && filename ? announcementUrl(filename) : undefined;
  return audio.playAnnouncement(url, () => speak(exerciseName));
}

export function speakPraise(audio: ExerciseAudio): Promise<void> {
  const clip = ensurePraiseClip();
  const url = announcementMode === "mp3" ? announcementUrl(clip.mp3) : undefined;
  return audio.playAnnouncement(url, () => ttsSpeakPraise(clip.text));
}

/** Preload with fetch; media-element readiness is not a playback permission. */
export async function preloadAnnouncements(audio: ExerciseAudio, orderedExerciseNames?: string[]): Promise<void> {
  if (typeof window === "undefined" || announcementMode !== "mp3") return;
  const exerciseFilenames = orderedExerciseNames
    ? orderedExerciseNames.map((name) => exerciseNameToMp3[name]).filter(Boolean)
    : Object.values(exerciseNameToMp3);
  const files = new Set([...exerciseFilenames, ensurePraiseClip().mp3]);
  // Keep preloading sequential; a failed file must not prevent later names from loading.
  for (const filename of files) {
    try {
      await audio.preload(announcementUrl(filename));
    } catch (error) {
      console.warn(`Failed to preload ${filename}:`, error);
    }
  }
}
