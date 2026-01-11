
export enum MoodLevel {
  VERY_SAD = 1,
  SAD = 2,
  NEUTRAL = 3,
  HAPPY = 4,
  VERY_HAPPY = 5
}

export interface MoodEntry {
  id: string;
  timestamp: number;
  level: MoodLevel;
  note: string;
  tags: string[];
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface MentalTask {
  id: string;
  title: string;
  completed: boolean;
  type: 'breathing' | 'journal' | 'reflection' | 'social';
}

export interface AppState {
  userMoods: MoodEntry[];
  messages: Message[];
  dailyTasks: MentalTask[];
  userName: string;
  language: 'id' | 'en';
  theme: 'slate' | 'midnight';
  streak: number;
}
