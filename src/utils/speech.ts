let englishVoices: SpeechSynthesisVoice[] | null = null;

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

const praisePhrases = [
  "Good job!",
  "Nice one, pal!",
  "Well done, buddy!",
  "You are the best",
  "All done!",
  "You've made it",
  "Keep up the good work!",
  "You're doing great!",
  "Fantastic work!",
  "Keep it up!",
];

export function speakPraise() {
  const randomPhrase = praisePhrases[Math.floor(Math.random() * praisePhrases.length)];
  speak(randomPhrase);
}
