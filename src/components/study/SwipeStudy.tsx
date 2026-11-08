import React, { useState } from 'react';
import { motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion';
import type { Question } from '@/types/database';
import { Star, AlertCircle, ArrowLeft, ArrowRight, Check, X, Undo2 } from 'lucide-react';

interface SwipeStudyProps {
  questions: Question[];
  currentIndex: number;
  isSwipeReversed: boolean;
  onToggleReverse: () => void;
  onAnswer: (confidence: boolean, isCorrect: boolean) => void;
  onToggleFavorite: (questionId: string) => void;
  onExit: () => void;
}

export const SwipeStudy: React.FC<SwipeStudyProps> = ({
  questions,
  currentIndex,
  isSwipeReversed,
  onToggleReverse,
  onAnswer,
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

  if (!currentQuestion) return null;

  // 左右の意味（反転設定を考慮）
  // 通常: 左 = 自信ナシ/間違い, 右 = 自信アリ/正解
  // 反転: 左 = 自信アリ/正解, 右 = 自信ナシ/間違い
  const leftLabel = isSwipeReversed
    ? step === 'confidence' ? '自信アリ' : '正解'
    : step === 'confidence' ? '自信ナシ' : '間違い';

  const rightLabel = isSwipeReversed
    ? step === 'confidence' ? '自信ナシ' : '間違い'
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
      finishCard(correct);
    }
  };

  const handleRightAction = () => {
    if (step === 'confidence') {
      const conf = isSwipeReversed ? false : true;
      setSelectedConfidence(conf);
      setStep('result');
    } else {
      const correct = isSwipeReversed ? false : true;
      finishCard(correct);
    }
  };

  const finishCard = (isCorrect: boolean) => {
    onAnswer(selectedConfidence, isCorrect);
    setStep('confidence');
  };

  return (
    <div className="flex flex-col items-center justify-between min-h-[calc(100vh-80px)] max-w-lg mx-auto px-4 py-3">
      {/* 上部ステータスバー */}
      <div className="w-full flex items-center justify-between text-sm font-semibold text-slate-500 mb-2">
        <button
          onClick={onExit}
          className="flex items-center gap-1 hover:text-slate-800 dark:hover:text-slate-200"
        >
          <Undo2 className="w-4 h-4" />
          <span>中断</span>
        </button>
        <span className="font-mono text-base font-bold text-slate-800 dark:text-slate-200">
          {currentIndex + 1} / {questions.length}
        </span>
        <button
          onClick={() => onToggleFavorite(currentQuestion.id)}
          className={`p-1.5 rounded-full transition ${
            currentQuestion.isFavorite
              ? 'text-amber-500 fill-amber-500'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Star className={`w-5 h-5 ${currentQuestion.isFavorite ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* スワイプカードエリア */}
      <div className="relative w-full flex-1 flex items-center justify-center my-2">
        {/* スワイプ方向ガイド（左） */}
        <button
          onClick={handleLeftAction}
          className="absolute left-0 z-20 flex flex-col items-center gap-1 p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 select-none -translate-x-1 sm:-translate-x-4"
        >
          <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700 flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold whitespace-nowrap">{leftLabel}</span>
        </button>

        {/* スワイプカード本体 */}
        <motion.div
          style={{ x, rotate, opacity }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={handleDragEnd}
          className="w-full h-[400px] sm:h-[450px] bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 rounded-3xl p-6 shadow-xl flex flex-col justify-between cursor-grab active:cursor-grabbing select-none"
        >
          <div>
            <div className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 font-mono">
                {currentQuestion.subject}
              </span>
              <span>{currentQuestion.unit}</span>
            </div>

            {/* 問題文 */}
            <div className="mt-4">
              <span className="text-xl font-black text-slate-400 mr-2">Q</span>
              <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-relaxed inline">
                {currentQuestion.question}
              </p>
            </div>
          </div>

          {/* 正解・解説エリア（回答後ステップ） */}
          {step === 'result' ? (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700"
            >
              <div className="text-xs font-bold text-slate-400 mb-1">正解</div>
              <div className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 mb-2">
                A. {currentQuestion.answer}
              </div>
              {currentQuestion.explanation && (
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-200 dark:border-slate-700 pt-2">
                  {currentQuestion.explanation}
                </p>
              )}
            </motion.div>
          ) : (
            <div className="text-center text-xs text-slate-400 py-6">
              左右にスワイプ、または矢印ボタンを押して自信度を回答
            </div>
          )}

          {/* カード下部ヒント */}
          <div className="text-center text-[11px] font-semibold text-slate-400">
            {step === 'confidence' ? '【ステップ 1/2】 自信度を選択' : '【ステップ 2/2】 正誤を判定'}
          </div>
        </motion.div>

        {/* スワイプ方向ガイド（右） */}
        <button
          onClick={handleRightAction}
          className="absolute right-0 z-20 flex flex-col items-center gap-1 p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 select-none translate-x-1 sm:translate-x-4"
        >
          <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700 flex items-center justify-center">
            <ArrowRight className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold whitespace-nowrap">{rightLabel}</span>
        </button>
      </div>

      {/* 下部設定：左右反転（参考画像に描かれていたチェックボックス） */}
      <div className="w-full flex items-center justify-center gap-4 py-2">
        <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isSwipeReversed}
            onChange={onToggleReverse}
            className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
          />
          <span>左右反転（利き手・配置切り替え）</span>
        </label>
      </div>
    </div>
  );
};

