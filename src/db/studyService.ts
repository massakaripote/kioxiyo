import { db } from './index';
import { INITIAL_QUESTIONS, INITIAL_UNITS } from './initialData';
import type {
  Question,
  MasteryStat,
  StudyLog,
  QuestionStudyType,
  SubjectType,
  StudyMode,
} from '@/types/database';

/**
 * データベースの初期化と初期問題の投入
 */
export async function initializeDatabase(): Promise<void> {
  const count = await db.questions.count();
  if (count === 0) {
    await reloadInitialData();
  }
}

/**
 * 初期問題・単元データを最新のコード定義から強制的に再読み込み（リロード）する
 */
export async function reloadInitialData(): Promise<void> {
  // 既存の単元・問題・習得状況をクリアして最新の初期データを投入
  await db.transaction('rw', db.questions, db.units, db.masteryStats, async () => {
    await db.questions.clear();
    await db.units.clear();
    await db.masteryStats.clear();

    await db.units.bulkAdd(INITIAL_UNITS);
    await db.questions.bulkAdd(INITIAL_QUESTIONS);

    const initialStats: MasteryStat[] = INITIAL_QUESTIONS.map((q) => ({
      questionId: q.id,
      points: 0,
      status: 'unseen',
      timesAsked: 0,
      correctCount: 0,
      incorrectCount: 0,
      isWeak: false,
    }));
    await db.masteryStats.bulkAdd(initialStats);
  });
}

/**
 * 回答結果を処理し、習得ポイントを更新・履歴を保存する
 *
 * 【厳格な習得ポイント増減ルール】
 * - 自信あり ＋ 正解: +1 (最大3)
 * - 自信なし ＋ 正解: 変動なし (履歴は記録)
 * - 不正解 (未マスター時 0〜2pt): 0にリセット
 * - マスター後の不正解 (3pt): 3 - 2 = 1pt
 */
export async function recordAnswer(params: {
  questionId: string;
  studyType: QuestionStudyType;
  confidence: boolean;
  isCorrect: boolean;
  userAnswer?: string;
}): Promise<{ pointsBefore: number; pointsAfter: number; newStatus: 'unseen' | 'learning' | 'mastered' }> {
  const { questionId, studyType, confidence, isCorrect, userAnswer } = params;

  let stat = await db.masteryStats.get(questionId);
  if (!stat) {
    stat = {
      questionId,
      points: 0,
      status: 'unseen',
      timesAsked: 0,
      correctCount: 0,
      incorrectCount: 0,
      isWeak: false,
    };
  }

  const pointsBefore = stat.points;
  let pointsAfter = pointsBefore;

  if (isCorrect) {
    if (confidence) {
      pointsAfter = Math.min(3, pointsBefore + 1);
    } else {
      // 自信なし正解はポイント維持
      pointsAfter = pointsBefore;
    }
  } else {
    // 不正解の場合
    if (pointsBefore >= 3) {
      // マスター後の不正解は 3 -> 1 (2ポイント減算)
      pointsAfter = 1;
    } else {
      // 通常の不正解は 0 にリセット
      pointsAfter = 0;
    }
  }

  const newStatus: 'unseen' | 'learning' | 'mastered' =
    pointsAfter >= 3 ? 'mastered' : 'learning';

  // 苦手判定：直近不正解、または不正解数が多い
  const isWeak = !isCorrect || (stat.incorrectCount + (!isCorrect ? 1 : 0) > stat.correctCount);

  // 統計の更新
  await db.masteryStats.put({
    questionId,
    points: pointsAfter,
    status: newStatus,
    timesAsked: stat.timesAsked + 1,
    correctCount: stat.correctCount + (isCorrect ? 1 : 0),
    incorrectCount: stat.incorrectCount + (!isCorrect ? 1 : 0),
    lastAnsweredAt: Date.now(),
    isWeak,
  });

  // 学習ログの保存（履歴は上書きせず全て追加）
  const log: StudyLog = {
    questionId,
    timestamp: Date.now(),
    studyType,
    confidence,
    isCorrect,
    userAnswer,
    pointsBefore,
    pointsAfter,
  };
  await db.studyLogs.add(log);

  return { pointsBefore, pointsAfter, newStatus };
}

/**
 * 条件に応じた出題対象の問題リストを取得
 */
export async function getQuestionsForStudy(params: {
  subject: SubjectType;
  unit?: string;
  mode: StudyMode;
  studyType: QuestionStudyType;
}): Promise<Question[]> {
  const { subject, unit, mode, studyType } = params;

  let query = db.questions.where('subject').equals(subject);
  let questions = await query.toArray();

  if (unit && unit !== 'すべて') {
    questions = questions.filter((q) => q.unit === unit);
  }

  // 出題形式フィルタ（問題がその出題形式をサポートしているか）
  questions = questions.filter((q) => q.type.includes(studyType));

  // 統計情報の取得
  const statsList = await db.masteryStats.where('questionId').anyOf(questions.map((q) => q.id)).toArray();
  const statsMap = new Map<string, MasteryStat>();
  statsList.forEach((s) => statsMap.set(s.questionId, s));

  // モード別フィルタ
  switch (mode) {
    case 'review': // 復習：出題済みかつ未マスター、または直近不正解
      questions = questions.filter((q) => {
        const s = statsMap.get(q.id);
        return s && s.timesAsked > 0 && (s.points < 3 || s.isWeak);
      });
      break;

    case 'unseen': // 未出題
      questions = questions.filter((q) => {
        const s = statsMap.get(q.id);
        return !s || s.timesAsked === 0 || s.status === 'unseen';
      });
      break;

    case 'favorite': // お気に入り
      questions = questions.filter((q) => q.isFavorite);
      break;

    case 'weak': // 苦手問題
      questions = questions.filter((q) => {
        const s = statsMap.get(q.id);
        return q.isWeakManual || (s && s.isWeak);
      });
      break;

    case 'random': // ランダム
      questions = [...questions].sort(() => Math.random() - 0.5);
      break;

    case 'all':
    default:
      // 全問題
      break;
  }

  // ランダムモード以外でも、復習や全体の場合は適度に出題順をシャッフル可能
  if (mode === 'review' || mode === 'all') {
    questions = [...questions].sort(() => Math.random() - 0.5);
  }

  return questions;
}

/**
 * 科目ごとの進捗サマリーを取得
 */
export async function getSubjectProgress(subject: SubjectType): Promise<{
  total: number;
  unseen: number;
  learning: number;
  mastered: number;
  correctRate: number;
  reviewCount: number;
}> {
  const questions = await db.questions.where('subject').equals(subject).toArray();
  const qIds = questions.map((q) => q.id);
  const stats = await db.masteryStats.where('questionId').anyOf(qIds).toArray();
  const statsMap = new Map<string, MasteryStat>();
  stats.forEach((s) => statsMap.set(s.questionId, s));

  let unseen = 0;
  let learning = 0;
  let mastered = 0;
  let totalCorrect = 0;
  let totalAsked = 0;
  let reviewCount = 0;

  for (const q of questions) {
    const s = statsMap.get(q.id);
    if (!s || s.timesAsked === 0) {
      unseen++;
    } else if (s.points >= 3) {
      mastered++;
    } else {
      learning++;
      reviewCount++;
    }

    if (s && s.timesAsked > 0) {
      totalCorrect += s.correctCount;
      totalAsked += s.timesAsked;
      if (s.isWeak && s.points >= 3) {
        reviewCount++;
      }
    }
  }

  const correctRate = totalAsked > 0 ? Math.round((totalCorrect / totalAsked) * 100) : 0;

  return {
    total: questions.length,
    unseen,
    learning,
    mastered,
    correctRate,
    reviewCount,
  };
}

/**
 * 今日の全体統計（ホーム画面の「今日 10問」「正答率 70%」「復習待ち 3問」）
 */
export async function getTodaySummary(): Promise<{
  todayCount: number;
  correctRate: number;
  reviewWaitingCount: number;
}> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const todayLogs = await db.studyLogs
    .where('timestamp')
    .aboveOrEqual(startOfDay.getTime())
    .toArray();

  const todayCount = todayLogs.length;
  const todayCorrect = todayLogs.filter((l) => l.isCorrect).length;
  const correctRate = todayCount > 0 ? Math.round((todayCorrect / todayCount) * 100) : 0;

  // 復習待ち：全問題のうち出題済みかつ未マスター、またはisWeak
  const stats = await db.masteryStats.toArray();
  const reviewWaitingCount = stats.filter(
    (s) => s.timesAsked > 0 && (s.points < 3 || s.isWeak)
  ).length;

  return {
    todayCount,
    correctRate,
    reviewWaitingCount,
  };
}

