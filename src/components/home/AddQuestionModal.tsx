import React, { useState } from 'react';
import { db } from '@/db';
import type { SubjectType, QuestionStudyType, Question } from '@/types/database';
import { SUBJECTS } from '@/types/database';
import { X, Plus, Check } from 'lucide-react';

interface AddQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSubject: SubjectType;
  defaultUnit: string;
  onQuestionAdded: () => void;
}

export const AddQuestionModal: React.FC<AddQuestionModalProps> = ({
  isOpen,
  onClose,
  defaultSubject,
  defaultUnit,
  onQuestionAdded,
}) => {
  const [subject, setSubject] = useState<SubjectType>(defaultSubject);
  const [unit, setUnit] = useState(defaultUnit === 'すべて' ? '' : defaultUnit);
  const [questionText, setQuestionText] = useState('');
  const [answerText, setAnswerText] = useState('');
  const [choice2, setChoice2] = useState('');
  const [choice3, setChoice3] = useState('');
  const [choice4, setChoice4] = useState('');
  const [explanation, setExplanation] = useState('');
  const [keywords, setKeywords] = useState('');
  const [types, setTypes] = useState<QuestionStudyType[]>(['swipe', 'multiple_choice', 'written']);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim() || !answerText.trim() || !unit.trim()) {
      alert('科目、単元、問題文、解答は必須です。');
      return;
    }

    const choices = [
      answerText.trim(),
      choice2.trim(),
      choice3.trim(),
      choice4.trim(),
    ].filter(Boolean);

    const newQuestion: Question = {
      id: `${subject.slice(0, 2)}-${Date.now()}`,
      subject,
      unit: unit.trim(),
      question: questionText.trim(),
      answer: answerText.trim(),
      choices: choices.length > 0 ? choices : [answerText.trim()],
      explanation: explanation.trim(),
      keywords: keywords
        .split(/[,、]/)
        .map((k) => k.trim())
        .filter(Boolean),
      type: types.length > 0 ? types : ['swipe', 'multiple_choice', 'written'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await db.questions.add(newQuestion);
    await db.masteryStats.add({
      questionId: newQuestion.id,
      points: 0,
      status: 'unseen',
      timesAsked: 0,
      correctCount: 0,
      incorrectCount: 0,
      isWeak: false,
    });

    // 単元が未登録なら登録
    const existingUnit = await db.units
      .where('subject')
      .equals(subject)
      .and((u) => u.name === unit.trim())
      .first();

    if (!existingUnit) {
      await db.units.add({
        id: `unit-${Date.now()}`,
        subject,
        name: unit.trim(),
        orderIndex: 99,
      });
    }

    onQuestionAdded();
    onClose();
  };

  const toggleType = (t: QuestionStudyType) => {
    if (types.includes(t)) {
      if (types.length > 1) setTypes(types.filter((item) => item !== t));
    } else {
      setTypes([...types, t]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-600" />
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              問題の手動追加
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-3.5 flex-1 text-xs sm:text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                科目
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value as SubjectType)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold"
              >
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                単元名
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="例: フランス革命"
                required
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              問題文
            </label>
            <textarea
              rows={2}
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="例: フランス革命が始まった年は？"
              required
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
            />
          </div>

          <div>
            <label className="font-bold text-emerald-600 dark:text-emerald-400 block mb-1">
              正解（答え）
            </label>
            <input
              type="text"
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder="例: 1789年"
              required
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-emerald-400 dark:border-emerald-600 font-bold"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              その他の選択肢（四択用・誤答ダミー）
            </label>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                value={choice2}
                onChange={(e) => setChoice2(e.target.value)}
                placeholder="ダミー1"
                className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
              />
              <input
                type="text"
                value={choice3}
                onChange={(e) => setChoice3(e.target.value)}
                placeholder="ダミー2"
                className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
              />
              <input
                type="text"
                value={choice4}
                onChange={(e) => setChoice4(e.target.value)}
                placeholder="ダミー3"
                className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              解説（任意）
            </label>
            <textarea
              rows={2}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="正解の背景や覚え方のポイント..."
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm shadow-md transition"
            >
              問題を登録する
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

