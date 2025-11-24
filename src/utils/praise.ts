export type PraiseClip = {
  text: string;
  mp3: string;
};

const praiseClips: PraiseClip[] = [
  { text: "Good job!", mp3: "good-job.mp3" },
  { text: "Nice one, pal!", mp3: "nice-one-pal.mp3" },
  { text: "Well done, buddy!", mp3: "well-done-buddy.mp3" },
  { text: "You are the best", mp3: "you-are-the-best.mp3" },
  { text: "All done!", mp3: "all-done.mp3" },
  { text: "You've made it", mp3: "youve-made-it.mp3" },
  { text: "Keep up the good work!", mp3: "keep-up-the-good-work.mp3" },
  { text: "You're doing great!", mp3: "youre-doing-great.mp3" },
  { text: "Fantastic work!", mp3: "fantastic-work.mp3" },
  { text: "Keep it up!", mp3: "keep-it-up.mp3" },
];

export function getRandomPraiseClip(): PraiseClip {
  return praiseClips[Math.floor(Math.random() * praiseClips.length)];
}

