export type SubjectType = '地理' | '歴史' | '公共' | '地学';

export const SUBJECTS: SubjectType[] = ['地理', '歴史', '公共', '地学'];

export type QuestionStudyType = 'swipe' | 'multiple_choice' | 'written';

export type StudyMode = 'all' | 'random' | 'review' | 'unseen' | 'favorite' | 'weak';

export interface Question {
  id: string;
  subject: SubjectType;
  unit: string;
  question: string;
  answer: string;
  choices?: string[];
  explanation?: string;
  keywords?: string[];
  type: QuestionStudyType[];
  isFavorite?: boolean;
  isWeakManual?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Unit {
  id: string;
  subject: SubjectType;
  name: string;
  orderIndex: number;
}

export interface MasteryStat {
  questionId: string;
  points: number; // 0, 1, 2, 3
  status: 'unseen' | 'learning' | 'mastered';
  timesAsked: number;
  correctCount: number;
  incorrectCount: number;
  lastAnsweredAt?: number;
  isWeak: boolean;
}

export interface StudyLog {
  id?: number;
  questionId: string;
  timestamp: number;
  studyType: QuestionStudyType;
  confidence: boolean; // true: 自信あり, false: 自信なし
  isCorrect: boolean;
  userAnswer?: string;
  pointsBefore: number;
  pointsAfter: number;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  isSwipeReversed: boolean; // 左右反転
  authorName: string;
}

