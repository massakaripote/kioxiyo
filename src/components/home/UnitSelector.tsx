import React, { useState } from 'react';
import type { SubjectType, Unit, StudyMode, QuestionStudyType } from '@/types/database';
import { Play, Plus, BookOpen, ChevronDown, CheckSquare, Sparkles } from 'lucide-react';

interface UnitSelectorProps {
  subject: SubjectType;
  units: Unit[];
  selectedUnit: string;
  onSelectUnit: (unit: string) => void;
  studyMode: StudyMode;
  onSelectStudyMode: (mode: StudyMode) => void;
  studyType: QuestionStudyType;
  onSelectStudyType: (type: QuestionStudyType) => void;
  onStartStudy: () => void;
  onOpenAddQuestion: () => void;
  onAddUnit: (unitName: string) => void;
  availableCount: number;
}

const STUDY_MODE_OPTIONS: { id: StudyMode; label: string; desc: string }[] = [
  { id: 'all', label: '全問題', desc: '選択単元の全問題を対象' },
  { id: 'review', label: '復習（忘却曲線）', desc: '復習期日が来ている問題' },
  { id: 'weak', label: '苦手中心（定着度低）', desc: '間違えやすい問題・習得前' },
  { id: 'unseen', label: '未出題のみ', desc: '一度も解いていない問題' },
  { id: 'favorite', label: 'お気に入り', desc: '★マークを付けた問題' },
  { id: 'random', label: 'ランダム出題', desc: '順序をシャッフルして出題' },
];

const STUDY_TYPE_OPTIONS: { id: QuestionStudyType; label: string; desc: string }[] = [
  { id: 'swipe', label: 'フラッシュ (カードスワイプ)', desc: '表裏をめくってテンポよく自己判定' },
  { id: 'multiple_choice', label: '四択式', desc: '4つの選択肢から正解を選ぶ' },
  { id: 'written', label: '記述式 (タイピング/自己採点)', desc: '答えを入力または思い浮かべて確認' },
];

export const UnitSelector: React.FC<UnitSelectorProps> = ({
  subject,
  units,
  selectedUnit,
  onSelectUnit,
  studyMode,
  onSelectStudyMode,
  studyType,
  onSelectStudyType,
  onStartStudy,
  onOpenAddQuestion,
  onAddUnit,
  availableCount,
}) => {
  const [newUnitName, setNewUnitName] = useState('');
  const [isAddingUnit, setIsAddingUnit] = useState(false);

  const handleAddUnitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUnitName.trim()) {
      onAddUnit(newUnitName.trim());
      setNewUnitName('');
      setIsAddingUnit(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-3.5 sm:p-5 shadow-sm mt-3">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* 左側：単元リスト */}
        <div className="md:col-span-6 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-blue-500" />
              単元
            </span>
            <button
              onClick={() => setIsAddingUnit(true)}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
            >
              <Plus className="w-3.5 h-3.5" />
              単元を追加
            </button>
          </div>

          {isAddingUnit && (
            <form onSubmit={handleAddUnitSubmit} className="flex gap-2 mb-2">
              <input
                type="text"
                value={newUnitName}
                onChange={(e) => setNewUnitName(e.target.value)}
                placeholder="新しい単元名..."
                className="flex-1 px-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <button
                type="submit"
                className="px-3 py-1 text-xs bg-blue-600 text-white rounded-xl font-bold"
              >
                追加
              </button>
              <button
                type="button"
                onClick={() => setIsAddingUnit(false)}
                className="px-2 py-1 text-xs text-slate-500"
              >
                取消
              </button>
            </form>
          )}

          {/* 単元スクロールエリア */}
          <div className="flex-1 max-h-56 overflow-y-auto space-y-1.5 pr-1">
            <button
              onClick={() => onSelectUnit('すべて')}
              className={`w-full p-2.5 rounded-xl text-left text-sm font-semibold transition flex items-center justify-between border ${selectedUnit === 'すべて'
                  ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-700 dark:text-blue-300'
                  : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
            >
              <span>{subject} 全単元</span>
              <span className="text-xs text-slate-400">全体</span>
            </button>

            {units.map((unit) => (
              <button
                key={unit.id}
                onClick={() => onSelectUnit(unit.name)}
                className={`w-full p-2.5 rounded-xl text-left text-sm font-semibold transition flex items-center justify-between border ${selectedUnit === unit.name
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-700 dark:text-blue-300'
                    : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
              >
                <span className="truncate">{unit.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 右側：出し方・回答方法（プルダウン）・スタート */}
        <div className="md:col-span-6 flex flex-col justify-between space-y-3">
          {/* 出し方（プルダウン形式） */}
          <div>
            <label
              htmlFor="study-mode-select"
              className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1.5"
            >
              出し方（出題対象）
            </label>
            <div className="relative">
              <select
                id="study-mode-select"
                value={studyMode}
                onChange={(e) => onSelectStudyMode(e.target.value as StudyMode)}
                className="w-full appearance-none bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 pr-10 text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition cursor-pointer"
              >
                {STUDY_MODE_OPTIONS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 dark:text-slate-400">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 pl-1">
              {STUDY_MODE_OPTIONS.find((m) => m.id === studyMode)?.desc}
            </p>
          </div>

          {/* 回答方法（プルダウン形式） */}
          <div>
            <label
              htmlFor="study-type-select"
              className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1.5"
            >
              回答方法（出題形式）
            </label>
            <div className="relative">
              <select
                id="study-type-select"
                value={studyType}
                onChange={(e) => onSelectStudyType(e.target.value as QuestionStudyType)}
                className="w-full appearance-none bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 pr-10 text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition cursor-pointer"
              >
                {STUDY_TYPE_OPTIONS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 dark:text-slate-400">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 pl-1">
              {STUDY_TYPE_OPTIONS.find((t) => t.id === studyType)?.desc}
            </p>
          </div>

          {/* アクションボタン */}
          <div className="pt-2 flex items-center gap-2">
            <button
              onClick={onOpenAddQuestion}
              className="px-3 py-3 rounded-2xl border-2 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold flex items-center gap-1 transition"
            >
              <Plus className="w-4 h-4" />
              <span>問題追加</span>
            </button>

            <button
              onClick={onStartStudy}
              disabled={availableCount === 0}
              className={`flex-1 py-3 px-4 rounded-2xl text-white font-extrabold text-base flex items-center justify-center gap-2 shadow-lg transition ${availableCount > 0
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] shadow-blue-500/25'
                  : 'bg-slate-400 cursor-not-allowed opacity-60'
                }`}
            >
              <Play className="w-5 h-5 fill-current" />
              <span>学習スタート ({availableCount}問)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

