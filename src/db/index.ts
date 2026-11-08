import Dexie, { type Table } from 'dexie';
import type { Question, Unit, MasteryStat, StudyLog } from '@/types/database';

export class KioxiyoDatabase extends Dexie {
  questions!: Table<Question, string>;
  units!: Table<Unit, string>;
  masteryStats!: Table<MasteryStat, string>;
  studyLogs!: Table<StudyLog, number>;

  constructor() {
    super('KioxiyoDB');
    this.version(1).stores({
      questions: 'id, subject, unit, isFavorite, createdAt',
      units: 'id, subject, name, orderIndex',
      masteryStats: 'questionId, points, status, isWeak, lastAnsweredAt',
      studyLogs: '++id, questionId, timestamp, studyType, isCorrect, confidence',
    });
  }
}

export const db = new KioxiyoDatabase();

