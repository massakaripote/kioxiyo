import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion';
import type { Question } from '@/types/database';
import { Star, AlertCircle, ArrowLeft, ArrowRight, Check, X, Undo2 } from 'lucide-react';
import { DataTableDisplay } from './DataTableDisplay';
import { CalculationExplanation } from './CalculationExplanation';

interface SwipeStudyProps {
  questions: Question[];
  currentIndex: number;
  isSwipeReversed: boolean;
  onToggleReverse: () => void;
  onAnswer: (confidence: boolean, isCorrect: boolean) => void;
  onPrev?: () => void;
  onToggleFavorite: (questionId: string) => void;
  onExit: () => void;
}

export const SwipeStudy: React.FC<SwipeStudyProps> = ({
  questions,
  currentIndex,
  isSwipeReversed,
  onToggleReverse,
  onAnswer,
  onPrev,
  onToggleFavorite,
  onExit,
}) => {
  const currentQuestion = questions[currentIndex];
  // step: 'confidence' (自信度判定: 自信あり/なし) -> 'result' (答え合わせ: 正解/間違い)
  const [step, setStep] = useState<'confidence' | 'result'>('confidence');
  const [selectedConfidence, setSelectedConfidence] = useState<boolean>(true);

  // Framer Motion ドラッグ用
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-18, 18]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0.6, 0.9, 1, 0.9, 0.6]);

  // 問題が切り替わったときに状態をリセット
  useEffect(() => {
    x.set(0);
    setStep('confidence');
    setSelectedConfidence(true);
  }, [currentIndex, x]);

  if (!currentQuestion) return null;

  // 左右の意味（反転設定を考慮）
  // 通常（純正デフォルト）: 左 = 自信アリ/正解, 右 = 自信ナシ/間違い
  // 反転: 左 = 自信ナシ/間違い, 右 = 自信アリ/正解
  const leftLabel = isSwipeReversed
    ? step === 'confidence' ? '自信アリ' : '正解'
    : step === 'confidence' ? '自信ナシ' : '不正解';

  const rightLabel = isSwipeReversed
    ? step === 'confidence' ? '自信ナシ' : '不正解'
    : step === 'confidence' ? '自信アリ' : '正解';

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 80;
    if (info.offset.x > threshold) {
      // 右スワイプ
      handleRightAction();
    } else if (info.offset.x < -threshold) {
      // 左スワイプ
      handleLeftAction();
    }
  };

  const handleLeftAction = () => {
    if (step === 'confidence') {
      const conf = isSwipeReversed ? true : false;
      setSelectedConfidence(conf);
      setStep('result');
    } else {
      const correct = isSwipeReversed ? true : false;
      finishCard(correct, selectedConfidence);
    }
  };

  const handleRightAction = () => {
    if (step === 'confidence') {
      const conf = isSwipeReversed ? false : true;
      setSelectedConfidence(conf);
      setStep('result');
    } else {
      const correct = isSwipeReversed ? false : true;
      finishCard(correct, selectedConfidence);
    }
  };

  const finishCard = (isCorrect: boolean, confidence: boolean) => {
    onAnswer(confidence, isCorrect);
    setStep('confidence');
  };

  return (
    <div className="flex flex-col items-center justify-between min-h-[calc(100dvh-72px)] sm:min-h-[calc(100vh-80px)] max-w-lg mx-auto px-1 sm:px-4 py-1.5 sm:py-3 overflow-hidden">
      {/* 上部ステータスバー */}
      <div className="w-full flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-500 mb-1 sm:mb-2 px-3 sm:px-0">
        <button
          onClick={onPrev}
          disabled={currentIndex === 0}
          className={`flex items-center gap-1 transition ${
            currentIndex === 0
              ? 'opacity-30 cursor-not-allowed text-slate-400'
              : 'hover:text-slate-800 dark:hover:text-slate-200 text-slate-600 dark:text-slate-400'
          }`}
          title="前の問題に戻る"
        >
          <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>前へ</span>
        </button>
        <span className="font-mono text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200">
          {currentIndex + 1} / {questions.length}
        </span>
        <button
          onClick={() => onToggleFavorite(currentQuestion.id)}
          className={`p-1.5 rounded-full transition ${currentQuestion.isFavorite
            ? 'text-amber-500 fill-amber-500'
            : 'text-slate-400 hover:text-slate-600'
            }`}
        >
          <Star className={`w-4 h-4 sm:w-5 sm:h-5 ${currentQuestion.isFavorite ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* スワイプカードエリア */}
      <div className="relative w-full flex-1 flex items-center justify-center my-1 sm:my-2">
        {/* スワイプ方向ガイド（左） */}
        <button
          onClick={handleLeftAction}
          className="absolute -left-2 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-1 p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 select-none pointer-events-auto sm:-translate-x-4"
        >
          <span className="text-sm font-bold">◀</span>
          <span className="text-[10px] sm:text-xs font-bold whitespace-nowrap bg-white/80 dark:bg-slate-900/80 px-1 rounded shadow-sm">
            {leftLabel}
          </span>
        </button>

        {/* スワイプカード本体 */}
        <motion.div
          style={{ x, rotate, opacity }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={handleDragEnd}
          className="w-full mx-2 sm:mx-0 min-h-[320px] max-h-[calc(100dvh-170px)] sm:h-[450px] bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 rounded-3xl p-4 sm:p-6 shadow-xl flex flex-col justify-between cursor-grab active:cursor-grabbing select-none overflow-y-auto no-scrollbar"
        >
          <div>
            <div className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-1 sm:mb-2 flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 font-mono text-[11px] sm:text-xs">
                {currentQuestion.subject}
              </span>
              <span className="text-[11px] sm:text-xs">{currentQuestion.unit}</span>
            </div>

            {/* 問題文 */}
            <div className="mt-2 sm:mt-4">
              <span className="text-lg sm:text-xl font-black text-slate-400 mr-2">Q</span>
              <p className="text-base sm:text-xl font-bold text-slate-900 dark:text-white leading-relaxed inline">
                {currentQuestion.question}
              </p>
              <div className="mt-1.5 text-[11px] font-mono font-medium text-slate-400 dark:text-slate-500">
                ID: {currentQuestion.id}
              </div>
            </div>

            {/* 資料・表（data_analysis形式など） */}
            {currentQuestion.dataTable && (
              <DataTableDisplay dataTable={currentQuestion.dataTable} />
            )}
          </div>

          {/* 正解・解説エリア（回答後ステップ） */}
          {step === 'result' ? (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 sm:mt-4 p-3 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700"
            >
              <div className="text-[10px] sm:text-xs font-bold text-slate-400 mb-0.5">正解</div>
              <div className="text-lg sm:text-2xl font-black text-blue-600 dark:text-blue-400 mb-1 sm:mb-2">
                A. {currentQuestion.answer}
              </div>
              {currentQuestion.explanation && (
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-200 dark:border-slate-700 pt-1.5 sm:pt-2 max-h-32 overflow-y-auto">
                  {currentQuestion.explanation}
                </p>
              )}
              {/* 計算過程・公式表示 */}
              {currentQuestion.calculation && (
                <CalculationExplanation calculation={currentQuestion.calculation} />
              )}
            </motion.div>
          ) : (
            <div className="text-center text-[11px] sm:text-xs text-slate-400 py-3 sm:py-6">
              左右にスワイプする。または矢印ボタンを押す。
            </div>
          )}

          {/* カード下部ヒント */}
          <div className="text-center text-[10px] sm:text-[11px] font-semibold text-slate-400 pt-1">
            {step === 'confidence' ? '【ステップ 1/2】 自信度を選択' : '【ステップ 2/2】 正誤を判定'}
          </div>
        </motion.div>

        {/* スワイプ方向ガイド（右） */}
        <button
          onClick={handleRightAction}
          className="absolute -right-2 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-1 p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 select-none pointer-events-auto sm:translate-x-4"
        >
          <span className="text-sm font-bold">▶</span>
          <span className="text-[10px] sm:text-xs font-bold whitespace-nowrap bg-white/80 dark:bg-slate-900/80 px-1 rounded shadow-sm">
            {rightLabel}
          </span>
        </button>
      </div>

      {/* 下部設定：中断（左） & 左右反転（中央） */}
      <div className="w-full relative flex items-center justify-between py-1.5 sm:py-2 shrink-0 border-t border-slate-100 dark:border-slate-800/60 px-3 sm:px-0">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition z-10"
        >
          <Undo2 className="w-3.5 h-3.5" />
          <span>中断</span>
        </button>

        <div className="absolute left-1/2 -translate-x-1/2 pointer-events-auto">
          <label className="flex items-center gap-2 text-[11px] sm:text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isSwipeReversed}
              onChange={onToggleReverse}
              className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
            />
            <span>左右反転（配置切替）</span>
          </label>
        </div>

        {/* 右側のスペーサー */}
        <div className="w-16" />
      </div>
    </div>
  );
};

