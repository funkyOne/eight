let englishVoices: SpeechSynthesisVoice[] | null = null;

import { getRandomPraiseClip } from "./praise";

export const speak = (text: string): void => {
  const utterance = new SpeechSynthesisUtterance(text);

  if (!englishVoices) {
    const voices = window.speechSynthesis.getVoices();
    englishVoices = voices.filter((voice) => voice.lang.startsWith("en"));
    const femaleVoices = englishVoices.filter((voice) => voice.name.toLowerCase().includes("female"));
    if (femaleVoices.length > 0) {
      englishVoices = femaleVoices;
    } else {
      const maleVoices = englishVoices.filter((voice) => voice.name.toLowerCase().includes("male"));
      if (maleVoices.length > 0) {
        englishVoices = maleVoices;
      }
    }
  }

  if (englishVoices.length > 0) {
    utterance.voice = englishVoices[0];
  }

  utterance.lang = "en-GB";

  window.speechSynthesis.cancel(); // Cancel any previous utterances
  window.speechSynthesis.speak(utterance);
};

export function speakPraise(phrase?: string): void {
  const text = phrase ?? getRandomPraiseClip().text;
  speak(text);
}
