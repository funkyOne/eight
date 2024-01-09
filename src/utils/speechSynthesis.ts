export const speak = (text: string): void => {
  const utterance = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();

  // Example: Selecting a voice (modify as needed)
  if (voices.length > 2) {
    utterance.voice = voices[2]; // This is just an example, modify as needed
  }

  window.speechSynthesis.speak(utterance);
};
