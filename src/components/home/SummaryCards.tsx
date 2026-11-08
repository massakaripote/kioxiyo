import React from 'react';
import { Flame, Target, RotateCcw } from 'lucide-react';

interface SummaryCardsProps {
  todayCount: number;
  correctRate: number;
  reviewWaitingCount: number;
  onReviewClick?: () => void;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  todayCount,
  correctRate,
  reviewWaitingCount,
  onReviewClick,
}) => {
  return (
    <div className="grid grid-cols-3 gap-2.5 sm:gap-4 my-3">
      {/* 今日 */}
      <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-3 sm:p-4 text-center shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-center gap-1 text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-bold">
          <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500" />
          <span>今日</span>
        </div>
        <div className="my-1">
          <span className="text-2xl sm:text-4xl font-extrabold text-slate-800 dark:text-slate-100 font-mono">
            {todayCount}
          </span>
          <span className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 ml-1">問</span>
        </div>
        <div className="text-[10px] sm:text-xs text-slate-400">解いた問題数</div>
      </div>

      {/* 正答率 */}
      <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-3 sm:p-4 text-center shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-center gap-1 text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-bold">
          <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" />
          <span>正答率</span>
        </div>
        <div className="my-1">
          <span className="text-2xl sm:text-4xl font-extrabold text-slate-800 dark:text-slate-100 font-mono">
            {correctRate}
          </span>
          <span className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 ml-0.5">%</span>
        </div>
        <div className="text-[10px] sm:text-xs text-slate-400">本日の正答割合</div>
      </div>

      {/* 復習待ち */}
      <div
        onClick={onReviewClick}
        className={`bg-white dark:bg-slate-900 border-2 rounded-2xl p-3 sm:p-4 text-center shadow-sm flex flex-col justify-between transition cursor-pointer hover:border-blue-500 ${
          reviewWaitingCount > 0
            ? 'border-blue-400 dark:border-blue-600 bg-blue-50/30 dark:bg-blue-950/20'
            : 'border-slate-200 dark:border-slate-800'
        }`}
      >
        <div className="flex items-center justify-center gap-1 text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-bold">
          <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500" />
          <span>復習待ち</span>
        </div>
        <div className="my-1">
          <span className="text-2xl sm:text-4xl font-extrabold text-blue-600 dark:text-blue-400 font-mono">
            {reviewWaitingCount}
          </span>
          <span className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 ml-1">問</span>
        </div>
        <div className="text-[10px] sm:text-xs text-blue-600 dark:text-blue-400 font-medium">
          {reviewWaitingCount > 0 ? '今すぐ復習' : 'すべて完了'}
        </div>
      </div>
    </div>
  );
};

