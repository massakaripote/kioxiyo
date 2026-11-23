import React, { useState, useEffect, useMemo } from 'react';
import type { Question } from '@/types/database';
import { motion } from 'framer-motion';
import { Star, Undo2, CheckCircle2, XCircle, ArrowRight, ArrowLeft, Check, HelpCircle } from 'lucide-react';
import { DataTableDisplay } from './DataTableDisplay';
import { CalculationExplanation } from './CalculationExplanation';
import { SequenceReorder } from './SequenceReorder';

interface ChoiceStudyProps {
  questions: Question[];
  currentIndex: number;
  isSwipeReversed: boolean;
  onToggleReverse: () => void;
  onAnswer: (confidence: boolean, isCorrect: boolean, selectedChoice: string) => void;
  onPrev?: () => void;
  onToggleFavorite: (questionId: string) => void;
  onExit: () => void;
}

export const ChoiceStudy: React.FC<ChoiceStudyProps> = ({
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
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [sequenceOrder, setSequenceOrder] = useState<string[]>([]);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [lastConfidence, setLastConfidence] = useState<boolean>(true);

  const isSequence = currentQuestion?.format === 'sequence' && !!currentQuestion.sequence;

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

  // 問題切り替え時に回答状態をリセット
  useEffect(() => {
    setSelectedChoice(null);
    setSequenceOrder([]);
    setIsAnswered(false);
  }, [currentIndex]);

  if (!currentQuestion) return null;

  const choices = shuffledChoices;

  // 正誤判定
  const isSequenceCorrect = isSequence && currentQuestion.sequence?.correctOrder
    ? currentQuestion.sequence.correctOrder.length === sequenceOrder.length &&
    currentQuestion.sequence.correctOrder.every((id, idx) => id === sequenceOrder[idx])
    : false;

  const isSelectedCorrect = isSequence
    ? isSequenceCorrect
    : selectedChoice?.trim() === currentQuestion.answer.trim();

  const canConfirm = isSequence ? sequenceOrder.length > 0 : !!selectedChoice;

  const handleConfirmAnswer = (confidence: boolean) => {
    if (!canConfirm || isAnswered) return;
    setLastConfidence(confidence);
    setIsAnswered(true);
  };

  const handleNext = () => {
    if (!canConfirm) return;
    const answerSummary = isSequence ? sequenceOrder.join(' → ') : selectedChoice || '';
    onAnswer(lastConfidence, isSelectedCorrect, answerSummary);
    setSelectedChoice(null);
    setSequenceOrder([]);
    setIsAnswered(false);
  };

  return (
    <div className="flex flex-col items-center justify-between min-h-[calc(100vh-80px)] max-w-lg mx-auto px-4 py-3">
      {/* 上部ステータスバー */}
      <div className="w-full flex items-center justify-between text-sm font-semibold text-slate-500 mb-2">
        <button
          onClick={onPrev}
          disabled={currentIndex === 0}
          className={`flex items-center gap-1 transition ${currentIndex === 0
              ? 'opacity-30 cursor-not-allowed text-slate-400'
              : 'hover:text-slate-800 dark:hover:text-slate-200 text-slate-600 dark:text-slate-400'
            }`}
          title="前の問題に戻る"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>前へ</span>
        </button>
        <span className="font-mono text-base font-bold text-slate-800 dark:text-slate-200">
          {currentIndex + 1} / {questions.length}
        </span>
        <button
          onClick={() => onToggleFavorite(currentQuestion.id)}
          className={`p-1.5 rounded-full transition ${currentQuestion.isFavorite
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
        <div className="mt-1.5 text-[11px] font-mono font-medium text-slate-400 dark:text-slate-500">
          ID: {currentQuestion.id}
        </div>

        {/* 資料・表（data_analysis形式など） */}
        {currentQuestion.dataTable && (
          <DataTableDisplay dataTable={currentQuestion.dataTable} />
        )}
      </div>

      {/* 回答エリア：並べ替え形式 または 4択グリッド */}
      {isSequence && currentQuestion.sequence ? (
        <div className="w-full my-2">
          <SequenceReorder
            sequence={currentQuestion.sequence}
            isAnswered={isAnswered}
            onOrderChange={setSequenceOrder}
          />
        </div>
      ) : (
        /* 4択選択肢グリッド */
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
      )}

      {/* 確定エリア / 結果解説エリア */}
      <div className="w-full my-2">
        {!isAnswered ? (
          <div>
            <div className="text-center text-xs font-semibold text-slate-400 mb-2">
              {isSequence
                ? '順番を並び替えたら、自信度を選択して回答を確定してください'
                : selectedChoice
                  ? '選択肢を選んだら、自信度を選択して回答を確定してください'
                  : '回答の選択肢をタップしてください'}
            </div>

            {/* 左右分割ボタン */}
            <div className="grid grid-cols-2 gap-2.5 py-1">
              {/* 左ボタン */}
              <button
                type="button"
                onClick={() => handleConfirmAnswer(isSwipeReversed ? true : false)}
                disabled={!canConfirm}
                className={`py-4 px-3 rounded-2xl border-2 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm transition-all select-none ${canConfirm
                  ? isSwipeReversed
                    ? 'bg-blue-600 hover:bg-blue-700 border-blue-600 text-white shadow-blue-500/20 active:scale-[0.98]'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 active:scale-[0.98]'
                  : 'bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-400 opacity-50 cursor-not-allowed'
                  }`}
              >
                {isSwipeReversed ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>自信アリ</span>
                  </>
                ) : (
                  <>
                    <HelpCircle className="w-4 h-4" />
                    <span>自信ナシ</span>
                  </>
                )}
              </button>

              {/* 右ボタン */}
              <button
                type="button"
                onClick={() => handleConfirmAnswer(isSwipeReversed ? false : true)}
                disabled={!canConfirm}
                className={`py-4 px-3 rounded-2xl border-2 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm transition-all select-none ${canConfirm
                  ? isSwipeReversed
                    ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 active:scale-[0.98]'
                    : 'bg-blue-600 hover:bg-blue-700 border-blue-600 text-white shadow-blue-500/20 active:scale-[0.98]'
                  : 'bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-400 opacity-50 cursor-not-allowed'
                  }`}
              >
                {isSwipeReversed ? (
                  <>
                    <HelpCircle className="w-4 h-4" />
                    <span>自信ナシ</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>自信アリ</span>
                  </>
                )}
              </button>
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
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-200 dark:border-slate-800 pt-2 mb-2">
                {currentQuestion.explanation}
              </p>
            )}

            {/* 計算問題の公式・手順解説 */}
            {currentQuestion.calculation && (
              <CalculationExplanation calculation={currentQuestion.calculation} className="mb-3" />
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

      {/* 画面下部フッター：中断（左） & 左右反転（中央） */}
      <div className="w-full relative flex items-center justify-between py-2 mt-auto border-t border-slate-100 dark:border-slate-800/60">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition z-10"
        >
          <Undo2 className="w-3.5 h-3.5" />
          <span>中断</span>
        </button>

        <div className="absolute left-1/2 -translate-x-1/2 pointer-events-auto">
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

        {/* 右側のスペーサー（中央揃えのバランス用） */}
        <div className="w-16" />
      </div>
    </div>
  );
};

