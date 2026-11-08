import React from 'react';
import type { SubjectType } from '@/types/database';
import { SUBJECTS } from '@/types/database';

export interface SubjectStats {
  total: number;
  unseen: number;
  learning: number;
  mastered: number;
  correctRate: number;
  reviewCount: number;
}

interface SubjectCardsProps {
  selectedSubject: SubjectType;
  onSelectSubject: (subject: SubjectType) => void;
  statsMap: Record<SubjectType, SubjectStats>;
}

export const SubjectCards: React.FC<SubjectCardsProps> = ({
  selectedSubject,
  onSelectSubject,
  statsMap,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-3.5 sm:p-5 shadow-sm">
      <div className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 mb-2.5 flex items-center justify-between">
        <span className="tracking-wide">科目選択</span>
        <div className="flex items-center gap-2 text-[11px] font-normal">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span>
            <span>マスター</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
            <span>出題済み</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 inline-block"></span>
            <span>未出題</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {SUBJECTS.map((subject) => {
          const isSelected = selectedSubject === subject;
          const stats = statsMap[subject] || {
            total: 0,
            unseen: 0,
            learning: 0,
            mastered: 0,
            correctRate: 0,
            reviewCount: 0,
          };

          const total = stats.total || 1;
          const masteredPct = Math.round((stats.mastered / total) * 100);
          const learningPct = Math.round((stats.learning / total) * 100);
          const unseenPct = 100 - masteredPct - learningPct;

          return (
            <button
              key={subject}
              onClick={() => onSelectSubject(subject)}
              className={`p-3 rounded-2xl text-left transition-all relative flex flex-col justify-between border-2 ${
                isSelected
                  ? 'border-red-500 bg-red-50/40 dark:bg-red-950/20 shadow-md ring-2 ring-red-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className={`text-base sm:text-lg font-extrabold ${
                    isSelected ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-slate-200'
                  }`}>
                    {subject}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    {stats.mastered}/{stats.total}問
                  </span>
                </div>

                {/* 3色進捗バー（赤・青・白） */}
                <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full my-2 overflow-hidden flex border border-slate-300 dark:border-slate-600">
                  {masteredPct > 0 && (
                    <div
                      style={{ width: `${masteredPct}%` }}
                      className="h-full bg-red-500 transition-all duration-300"
                      title={`マスター: ${stats.mastered}問 (${masteredPct}%)`}
                    />
                  )}
                  {learningPct > 0 && (
                    <div
                      style={{ width: `${learningPct}%` }}
                      className="h-full bg-blue-500 transition-all duration-300"
                      title={`出題済み未習得: ${stats.learning}問 (${learningPct}%)`}
                    />
                  )}
                  {unseenPct > 0 && (
                    <div
                      style={{ width: `${unseenPct}%` }}
                      className="h-full bg-white dark:bg-slate-900 transition-all duration-300"
                      title={`未出題: ${stats.unseen}問 (${unseenPct}%)`}
                    />
                  )}
                </div>
              </div>

              {/* 下部情報：正答率・復習待ち */}
              <div className="grid grid-cols-2 gap-1 pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60 text-center">
                <div className="bg-white/80 dark:bg-slate-900/60 rounded-lg py-1 px-0.5 border border-slate-200 dark:border-slate-700/50">
                  <div className="text-[9px] text-slate-400">正答率</div>
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">
                    {stats.correctRate}%
                  </div>
                </div>
                <div className="bg-white/80 dark:bg-slate-900/60 rounded-lg py-1 px-0.5 border border-slate-200 dark:border-slate-700/50">
                  <div className="text-[9px] text-slate-400">復習待ち</div>
                  <div className={`text-xs font-bold font-mono ${
                    stats.reviewCount > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'
                  }`}>
                    {stats.reviewCount}問
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

