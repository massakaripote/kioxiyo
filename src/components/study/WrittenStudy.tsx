import React, { useState } from 'react';
import type { Question } from '@/types/database';
import { Star, Undo2, ArrowRight, Check, X } from 'lucide-react';

interface WrittenStudyProps {
  questions: Question[];
  currentIndex: number;
  onAnswer: (confidence: boolean, isCorrect: boolean, userAnswer: string) => void;
  onToggleFavorite: (questionId: string) => void;
  onExit: () => void;
}

export const WrittenStudy: React.FC<WrittenStudyProps> = ({
  questions,
  currentIndex,
  onAnswer,
  onToggleFavorite,
  onExit,
}) => {
  const currentQuestion = questions[currentIndex];
  const [userText, setUserText] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);

  if (!currentQuestion) return null;

  const handleSubmitText = (e: React.FormEvent) => {
    e.preventDefault();
    setShowAnswer(true);
  };

  const handleSelfGrade = (confidence: boolean, isCorrect: boolean) => {
    onAnswer(confidence, isCorrect, userText);
    setUserText('');
    setShowAnswer(false);
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

      {/* 入力エリア または 採点エリア */}
      <div className="w-full my-2 flex-1 flex flex-col justify-center">
        {!showAnswer ? (
          <form onSubmit={handleSubmitText} className="space-y-3">
            <textarea
              rows={3}
              value={userText}
              onChange={(e) => setUserText(e.target.value)}
              placeholder="ここに回答を入力してください（思い出せない場合は空欄で解答表示）"
              className="w-full p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-base focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none shadow-inner"
              autoFocus
            />
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-base flex items-center justify-center gap-2 shadow-lg transition active:scale-[0.98]"
            >
              <span>模範解答を見る</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        ) : (
          /* 自己判定フェーズ */
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div>
              <div className="text-xs font-bold text-slate-400 mb-1">あなたの回答:</div>
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-medium text-sm text-slate-800 dark:text-slate-200">
                {userText.trim() ? userText : '（未入力）'}
              </div>
            </div>

            <div>
              <div className="text-xs font-bold text-slate-400 mb-1">模範解答:</div>
              <div className="text-xl font-black text-blue-600 dark:text-blue-400">
                {currentQuestion.answer}
              </div>
            </div>

            {currentQuestion.keywords && currentQuestion.keywords.length > 0 && (
              <div>
                <div className="text-xs font-bold text-slate-400 mb-1">採点キーワード:</div>
                <div className="flex flex-wrap gap-1.5">
                  {currentQuestion.keywords.map((kw, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {currentQuestion.explanation && (
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 border-t border-slate-200 dark:border-slate-800 pt-2 leading-relaxed">
                {currentQuestion.explanation}
              </p>
            )}

            {/* 自己判定ボタン（自信あり・なし × 正解・不正解） */}
            <div className="pt-2">
              <div className="text-xs font-bold text-slate-500 text-center mb-2">
                自分の回答を判定してください
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleSelfGrade(false, false)}
                  className="py-3 px-2 rounded-xl border-2 border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 font-bold text-xs flex items-center justify-center gap-1 hover:bg-rose-100"
                >
                  <X className="w-4 h-4" />
                  <span>不正解</span>
                </button>

                <button
                  onClick={() => handleSelfGrade(false, true)}
                  className="py-3 px-2 rounded-xl border-2 border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center gap-1 hover:bg-blue-100"
                >
                  <Check className="w-4 h-4" />
                  <span>正解（自信なし）</span>
                </button>
              </div>

              <button
                onClick={() => handleSelfGrade(true, true)}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm flex items-center justify-center gap-1.5 shadow-md"
              >
                <Check className="w-5 h-5" />
                <span>正解！（自信あり +1pt）</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="text-center text-xs text-slate-400 py-1">
        ※ 記述式は自己判定で行われます（AIによる自動判定は行いません）
      </div>
    </div>
  );
};

