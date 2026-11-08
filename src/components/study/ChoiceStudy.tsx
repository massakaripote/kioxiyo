import React, { useState, useEffect, useMemo } from 'react';
import type { Question } from '@/types/database';
import { motion, useMotionValue, useTransform, animate, type PanInfo } from 'framer-motion';
import { Star, Undo2, CheckCircle2, XCircle, ArrowRight, ArrowLeft } from 'lucide-react';

interface ChoiceStudyProps {
  questions: Question[];
  currentIndex: number;
  isSwipeReversed: boolean;
  onToggleReverse: () => void;
  onAnswer: (confidence: boolean, isCorrect: boolean, selectedChoice: string) => void;
  onToggleFavorite: (questionId: string) => void;
  onExit: () => void;
}

export const ChoiceStudy: React.FC<ChoiceStudyProps> = ({
  questions,
  currentIndex,
  isSwipeReversed,
  onToggleReverse,
  onAnswer,
  onToggleFavorite,
  onExit,
}) => {
  const currentQuestion = questions[currentIndex];
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [lastConfidence, setLastConfidence] = useState<boolean>(true);

  // 選択肢のシャッフル（Fisher-Yatesシャッフルで問題ごとに毎回ランダムに並び替え）
  const shuffledChoices = useMemo(() => {
    if (!currentQuestion) return [];
    const raw = currentQuestion.choices && currentQuestion.choices.length > 0
      ? [...currentQuestion.choices]
      : [currentQuestion.answer];

    // 正解が含まれていない場合は必ず追加
    if (!raw.some((c) => c.trim() === currentQuestion.answer.trim())) {
      raw.push(currentQuestion.answer);
    }

    // Fisher-Yates シャッフル
    for (let i = raw.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [raw[i], raw[j]] = [raw[j], raw[i]];
    }
    return raw;
  }, [currentQuestion?.id, currentIndex]);

  // スワイプ操作用
  const x = useMotionValue(0);

  // 問題切り替え時や回答状態リセット時に位置をゼロへ戻す
  useEffect(() => {
    x.set(0);
    setSelectedChoice(null);
    setIsAnswered(false);
  }, [currentIndex, x]);

  if (!currentQuestion) return null;

  const choices = shuffledChoices;

  const handleConfirmAnswer = (confidence: boolean) => {
    if (!selectedChoice || isAnswered) return;
    setLastConfidence(confidence);
    setIsAnswered(true);
  };

  const handleNext = () => {
    if (!selectedChoice) return;
    const isCorrect = selectedChoice.trim() === currentQuestion.answer.trim();
    onAnswer(lastConfidence, isCorrect, selectedChoice);
    setSelectedChoice(null);
    setIsAnswered(false);
    x.set(0);
  };

  const handleDragEnd = (_e: any, info: PanInfo) => {
    if (isAnswered || !selectedChoice) {
      animate(x, 0, { type: 'spring', stiffness: 500, damping: 30 });
      return;
    }
    const threshold = 50;
    if (info.offset.x > threshold) {
      // 右
      handleConfirmAnswer(!isSwipeReversed);
      animate(x, 0, { type: 'spring', stiffness: 400, damping: 25 });
    } else if (info.offset.x < -threshold) {
      // 左
      handleConfirmAnswer(isSwipeReversed);
      animate(x, 0, { type: 'spring', stiffness: 400, damping: 25 });
    } else {
      // 閾値未満でドラッグ終了した場合は中央へスプリングで戻す
      animate(x, 0, { type: 'spring', stiffness: 500, damping: 30 });
    }
  };

  const isSelectedCorrect = selectedChoice?.trim() === currentQuestion.answer.trim();

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

      {/* 問題表示カード */}
      <div className="w-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-md my-2">
        <div className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-1 flex items-center gap-1.5">
          <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 font-mono">
            {currentQuestion.subject}
          </span>
          <span>{currentQuestion.unit}</span>
        </div>
        <div className="mt-2 text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
          <span className="text-blue-600 dark:text-blue-400 font-black mr-1">Q.</span>
          {currentQuestion.question}
        </div>
      </div>

      {/* 4択選択肢グリッド */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5 my-2">
        {choices.map((choice, idx) => {
          const isChosen = selectedChoice === choice;
          const isCorrect = choice.trim() === currentQuestion.answer.trim();

          let btnStyle = 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:border-blue-400';

          if (isAnswered) {
            if (isCorrect) {
              btnStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 ring-2 ring-emerald-500/30';
            } else if (isChosen && !isCorrect) {
              btnStyle = 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200';
            } else {
              btnStyle = 'opacity-40 border-slate-200 dark:border-slate-800';
            }
          } else if (isChosen) {
            btnStyle = 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-200 ring-2 ring-blue-500/30';
          }

          return (
            <button
              key={idx}
              disabled={isAnswered}
              onClick={() => setSelectedChoice(choice)}
              className={`p-3.5 rounded-2xl border-2 text-left font-bold text-sm sm:text-base transition flex items-center justify-between ${btnStyle}`}
            >
              <span>{choice}</span>
              {isAnswered && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 ml-1" />}
              {isAnswered && isChosen && !isCorrect && <XCircle className="w-5 h-5 text-rose-600 shrink-0 ml-1" />}
            </button>
          );
        })}
      </div>

      {/* 確定エリア / 結果解説エリア */}
      <div className="w-full my-2">
        {!isAnswered ? (
          <div>
            <div className="text-center text-xs font-semibold text-slate-400 mb-2">
              {selectedChoice
                ? '選択肢を選びました。バーを左右にスワイプして自信度を確定してください'
                : '回答の選択肢をタップしてください'}
            </div>

            {/* スワイプ可能な確定バー（親要素のoverflow-hiddenを削除し、左右スワイプ時にボタン全体が枠外へスムーズに移動） */}
            <div className="relative w-full py-1">
              <motion.div
                style={{ x }}
                drag={selectedChoice ? 'x' : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.4}
                onDragEnd={handleDragEnd}
                className={`py-5 px-4 rounded-2xl border-2 select-none shadow-md transition-colors ${
                  selectedChoice
                    ? 'bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 dark:from-slate-800 dark:via-indigo-950/40 dark:to-slate-800 border-indigo-400 cursor-grab active:cursor-grabbing ring-2 ring-indigo-400/20'
                    : 'bg-slate-100 dark:bg-slate-800/40 border-slate-300 dark:border-slate-700 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between pointer-events-none">
                  <div className="flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-slate-700 dark:text-slate-300">
                    <ArrowLeft className="w-4 h-4 text-slate-400" />
                    <span>{isSwipeReversed ? '自信ありで確定' : '自信なしで確定'}</span>
                  </div>
                  <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/70">
                    スワイプ
                  </span>
                  <div className="flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-slate-700 dark:text-slate-300">
                    <span>{isSwipeReversed ? '自信なしで確定' : '自信ありで確定'}</span>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        ) : (
          /* 回答後の解説と次の問題へ */
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-lg"
          >
            <div className="flex items-center gap-2 mb-2">
              {isSelectedCorrect ? (
                <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-base">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>正解！</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-rose-600 font-bold text-base">
                  <XCircle className="w-5 h-5" />
                  <span>不正解...</span>
                </div>
              )}
              <span className="text-xs text-slate-400 font-medium">
                （判定: {lastConfidence ? '自信あり' : '自信なし'}）
              </span>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">模範解答:</div>
            <div className="text-base font-extrabold text-blue-600 dark:text-blue-400 mb-2">
              {currentQuestion.answer}
            </div>

            {currentQuestion.explanation && (
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-200 dark:border-slate-800 pt-2 mb-3">
                {currentQuestion.explanation}
              </p>
            )}

            <button
              onClick={handleNext}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md transition"
            >
              <span>次の問題へ</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </div>

      {/* 左右反転設定 */}
      <div className="w-full flex items-center justify-center gap-4 py-1">
        <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isSwipeReversed}
            onChange={onToggleReverse}
            className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
          />
          <span>左右反転</span>
        </label>
      </div>
    </div>
  );
};

