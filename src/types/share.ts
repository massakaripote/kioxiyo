import type { Question, SubjectType } from './database';

export interface SharedProblemSet {
  id: string;
  title: string;
  description: string;
  subject: SubjectType;
  unit: string;
  questions: Question[];
  authorUid: string;
  authorName: string;
  isPublic: boolean; // true: 一般公開, false: URL限定公開
  createdAt: number;
  updatedAt: number;
  imageUrl?: string; // 将来の拡張用
}

export interface CurrentAffairPost {
  id: string;
  question: string;
  answer: string;
  explanation: string;
  category: string;
  authorUid: string;
  authorName: string;
  createdAt: number;
  updatedAt: number;
  imageUrl?: string; // 将来の拡張用
}

export interface ReportItem {
  id: string;
  targetType: 'problemSet' | 'currentAffair';
  targetId: string;
  reporterUid: string;
  reason: string;
  details?: string;
  createdAt: number;
  status: 'pending' | 'resolved' | 'dismissed';
}

