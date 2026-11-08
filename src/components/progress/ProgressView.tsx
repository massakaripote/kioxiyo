import React, { useState, useEffect } from 'react';
import { db } from '@/db';
import type { Question, MasteryStat, StudyLog, SubjectType } from '@/types/database';
import { SUBJECTS } from '@/types/database';
import { X, Award, Star, AlertCircle, Clock, BookOpen, ChevronRight } from 'lucide-react';

interface ProgressViewProps {
  isOpen: boolean;
  onClose: () => void;
  onStartStudyQuestions?: (questions: Question[]) => void;
}

export const ProgressView: React.FC<ProgressViewProps> = ({
  isOpen,
  onClose,
  onStartStudyQuestions,
}) => {
  const [activeTab, setActiveTab] = useState<'progress' | 'history' | 'weak' | 'favorite'>('progress');
  const [selectedSubject, setSelectedSubject] = useState<SubjectType>('歴史');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [statsMap, setStatsMap] = useState<Map<string, MasteryStat>>(new Map());
  const [logs, setLogs] = useState<StudyLog[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    loadData();
  }, [isOpen, selectedSubject, activeTab]);

  const loadData = async () => {
    const allQ = await db.questions.toArray();
    setQuestions(allQ);

    const allStats = await db.masteryStats.toArray();
    const sm = new Map<string, MasteryStat>();
    allStats.forEach((s) => sm.set(s.questionId, s));
    setStatsMap(sm);

    const recentLogs = await db.studyLogs.orderBy('timestamp').reverse().limit(50).toArray();
    setLogs(recentLogs);
  };

  if (!isOpen) return null;

  // 苦手問題
  const weakQuestions = questions.filter((q) => {
    const s = statsMap.get(q.id);
    return q.isWeakManual || (s && s.isWeak);
  });

  // お気に入り
  const favoriteQuestions = questions.filter((q) => q.isFavorite);

  // 科目別・単元別の進捗集計
  const subjectQuestions = questions.filter((q) => q.subject === selectedSubject);
  const units = Array.from(new Set(subjectQuestions.map((q) => q.unit)));

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* ヘッダー */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-red-500" />
            <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
              習得状況・学習進捗ダッシュボード
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* タブ */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-5 pt-2 overflow-x-auto">
          {[
            { id: 'progress', label: '単元別進捗' },
            { id: 'weak', label: `苦手問題 (${weakQuestions.length})` },
            { id: 'favorite', label: `お気に入り (${favoriteQuestions.length})` },
            { id: 'history', label: '学習履歴' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-2.5 px-3 font-bold text-xs sm:text-sm whitespace-nowrap border-b-2 transition ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* コンテンツ */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'progress' && (
            <div>
              {/* 科目選択ピル */}
              <div className="flex gap-2 mb-4">
                {SUBJECTS.map((sub) => (
                  <button
                    key={sub}
                    onClick={() => setSelectedSubject(sub)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      selectedSubject === sub
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>

              {/* 単元別リスト */}
              <div className="space-y-3">
                {units.map((unitName) => {
                  const unitQs = subjectQuestions.filter((q) => q.unit === unitName);
                  let mastered = 0;
                  let learning = 0;
                  let unseen = 0;

                  unitQs.forEach((q) => {
                    const s = statsMap.get(q.id);
                    if (!s || s.timesAsked === 0) unseen++;
                    else if (s.points >= 3) mastered++;
                    else learning++;
                  });

                  const total = unitQs.length || 1;
                  const masterPct = Math.round((mastered / total) * 100);
                  const learningPct = Math.round((learning / total) * 100);
                  const unseenPct = 100 - masterPct - learningPct;

                  return (
                    <div
                      key={unitName}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                          {unitName}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-500">
                          マスター: {mastered}/{unitQs.length}問 ({masterPct}%)
                        </span>
                      </div>

                      {/* 3色バー */}
                      <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex border border-slate-300 dark:border-slate-600 my-1">
                        {masterPct > 0 && <div style={{ width: `${masterPct}%` }} className="h-full bg-red-500" />}
                        {learningPct > 0 && <div style={{ width: `${learningPct}%` }} className="h-full bg-blue-500" />}
                        {unseenPct > 0 && <div style={{ width: `${unseenPct}%` }} className="h-full bg-white dark:bg-slate-900" />}
                      </div>

                      <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                        <span>赤: マスター {mastered}</span>
                        <span>青: 出題済 {learning}</span>
                        <span>白: 未出題 {unseen}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'weak' && (
            <div className="space-y-2">
              <div className="text-xs text-slate-500 mb-2">
                間違えた問題や、正答率が低い問題が自動的にリストアップされます。
              </div>
              {weakQuestions.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  苦手問題はありません！よく頑張っています。
                </div>
              ) : (
                weakQuestions.map((q) => {
                  const s = statsMap.get(q.id);
                  return (
                    <div
                      key={q.id}
                      className="p-3.5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 flex items-start justify-between gap-2"
                    >
                      <div>
                        <div className="text-[10px] font-bold text-rose-600 dark:text-rose-400">
                          {q.subject} &gt; {q.unit}
                        </div>
                        <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                          {q.question}
                        </div>
                        <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-1">
                          答: {q.answer}
                        </div>
                        {s && (
                          <div className="text-[10px] text-slate-400 mt-1 font-mono">
                            出題 {s.timesAsked}回 / 正解 {s.correctCount}回 / 不正解 {s.incorrectCount}回 / 現在ポイント {s.points}pt
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'favorite' && (
            <div className="space-y-2">
              {favoriteQuestions.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  お気に入り登録された問題はまだありません。
                </div>
              ) : (
                favoriteQuestions.map((q) => (
                  <div
                    key={q.id}
                    className="p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60"
                  >
                    <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                      {q.subject} &gt; {q.unit}
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                      {q.question}
                    </div>
                    <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-1">
                      答: {q.answer}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-2">
              {logs.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  まだ学習履歴がありません。
                </div>
              ) : (
                logs.map((log) => {
                  const q = questions.find((item) => item.id === log.questionId);
                  return (
                    <div
                      key={log.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between"
                    >
                      <div className="flex-1 mr-2">
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          <span>{new Date(log.timestamp).toLocaleString()}</span>
                          <span className="uppercase font-mono px-1 bg-slate-200 dark:bg-slate-700 rounded">
                            {log.studyType}
                          </span>
                          <span>{log.confidence ? '自信あり' : '自信なし'}</span>
                        </div>
                        <div className="font-bold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                          {q ? q.question : `ID: ${log.questionId}`}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            log.isCorrect
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                              : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                          }`}
                        >
                          {log.isCorrect ? '正解' : '不正解'}
                        </span>
                        <span className="font-mono text-slate-500">
                          {log.pointsBefore}pt → {log.pointsAfter}pt
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

