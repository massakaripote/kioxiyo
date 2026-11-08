import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import type { Question } from '@/types/database';
import { RotateCcw, Home, ArrowRight, Award, CheckCircle2, XCircle } from 'lucide-react';

export interface AnswerResultItem {
  question: Question;
  confidence: boolean;
  isCorrect: boolean;
  pointsBefore: number;
  pointsAfter: number;
}

interface ResultViewProps {
  results: AnswerResultItem[];
  onReviewMistakes: (mistakeQuestions: Question[]) => void;
  onNextUnit: () => void;
  onHome: () => void;
}

export const ResultView: React.FC<ResultViewProps> = ({
  results,
  onReviewMistakes,
  onNextUnit,
  onHome,
}) => {
  const total = results.length;
  const correctCount = results.filter((r) => r.isCorrect).length;
  const incorrectCount = total - correctCount;
  const correctRate = total > 0 ? Math.round((correctCount / total) * 100) : 0;

  // マスターになった問題（pointsAfter === 3 かつ pointsBefore < 3）
  const newlyMastered = results.filter(
    (r) => r.pointsAfter >= 3 && r.pointsBefore < 3
  );

  // 間違えた問題
  const mistakeItems = results.filter((r) => !r.isCorrect);

  useEffect(() => {
    // 80%以上正解またはマスター誕生で紙吹雪
    if (correctRate >= 80 || newlyMastered.length > 0) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [correctRate, newlyMastered.length]);

  return (
    <div className="max-w-lg mx-auto px-4 py-6 flex flex-col items-center">
      {/* メイン成績カード */}
      <div className="w-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl text-center mb-6">
        <div className="text-xs font-bold text-slate-400 mb-1 tracking-wider uppercase">
          学習リザルト
        </div>

        {/* 手描き画像の「7 / 10 問 正解」 */}
        <div className="my-3">
          <span className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white font-mono">
            {correctCount}
          </span>
          <span className="text-xl sm:text-2xl font-bold text-slate-400 mx-1">/</span>
          <span className="text-2xl sm:text-3xl font-bold text-slate-500 font-mono">
            {total}
          </span>
          <span className="text-lg font-bold text-slate-700 dark:text-slate-300 ml-2">問 正解</span>
        </div>

        {/* 正答率バッジ */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-sm font-extrabold mb-3">
          <span>正答率 {correctRate}%</span>
        </div>

        {/* 新たにマスターした問題 */}
        {newlyMastered.length > 0 && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-2xl flex items-center justify-center gap-2 text-red-600 dark:text-red-400 font-extrabold text-sm my-2">
            <Award className="w-5 h-5 fill-current" />
            <span>🎉 {newlyMastered.length}問が「マスター」になりました！</span>
          </div>
        )}
      </div>

      {/* 手描き画像3のボタン配置を完全再現 */}
      <div className="w-full space-y-3 mb-6">
        <div className="grid grid-cols-2 gap-3">
          {/* 復習する */}
          <button
            onClick={() => onReviewMistakes(mistakeItems.map((m) => m.question))}
            disabled={mistakeItems.length === 0}
            className={`py-4 px-3 rounded-2xl border-2 font-extrabold text-sm sm:text-base flex items-center justify-center gap-1.5 shadow-md transition ${
              mistakeItems.length > 0
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-400 opacity-50 cursor-not-allowed'
            }`}
          >
            <RotateCcw className="w-5 h-5" />
            <span>復習する ({mistakeItems.length})</span>
          </button>

          {/* 次の単元 */}
          <button
            onClick={onNextUnit}
            className="py-4 px-3 rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-extrabold text-sm sm:text-base flex items-center justify-center gap-1.5 shadow-md transition"
          >
            <span>次の単元</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* ホームへ */}
        <button
          onClick={onHome}
          className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-extrabold text-base flex items-center justify-center gap-2 shadow-lg transition"
        >
          <Home className="w-5 h-5" />
          <span>ホームへ</span>
        </button>
      </div>

      {/* 間違えた問題一覧（復習しやすいレビューリスト） */}
      {mistakeItems.length > 0 && (
        <div className="w-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
          <div className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5">
            <XCircle className="w-4 h-4 text-rose-500" />
            <span>間違えた問題の確認</span>
          </div>

          <div className="space-y-3">
            {mistakeItems.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm"
              >
                <div className="font-bold text-slate-900 dark:text-white mb-1">
                  Q. {item.question.question}
                </div>
                <div className="font-extrabold text-blue-600 dark:text-blue-400">
                  正解: {item.question.answer}
                </div>
                {item.question.explanation && (
                  <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 border-t border-slate-200 dark:border-slate-700/60 pt-1">
                    {item.question.explanation}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

