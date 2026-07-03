export type SubtitleMode = "bilingual" | "english" | "hidden";

export type LoopMode = "off" | "sentence";

export type Difficulty = "beginner" | "intermediate" | "advanced";

export type SubtitleLine = {
  id: string;
  startTime: number;
  endTime: number;
  english: string;
  chinese: string;
  wordCardIds: string[];
};

export type WordCard = {
  id: string;
  term: string;
  meaning: string;
  example: string;
  status: "new" | "learning" | "known";
};

export type PracticeVideo = {
  id: string;
  slug: string;
  title: string;
  creator: string;
  duration: number;
  level: Difficulty;
  topics: string[];
  description: string;
  videoUrl: string;
  posterUrl: string;
  subtitleLines: SubtitleLine[];
  wordCards: WordCard[];
};
