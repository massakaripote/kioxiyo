import React, { useState, useEffect } from 'react';
import type { SequenceData, SequenceItem } from '@/types/database';
import { CheckCircle2, XCircle } from 'lucide-react';

interface SequenceReorderProps {
  sequence: SequenceData;
  isAnswered: boolean;
  onOrderChange: (orderedItemIds: string[]) => void;
}

export const SequenceReorder: React.FC<SequenceReorderProps> = ({
  sequence,
  isAnswered,
  onOrderChange,
}) => {
  const [items, setItems] = useState<SequenceItem[]>([]);

  // 問題開始時にアイテムをランダムシャッフル（正解順序は変えずに表示順のみシャッフル）
  useEffect(() => {
    if (!sequence || !sequence.items) return;
    const shuffled = [...sequence.items];
    // Fisher-Yates シャッフル
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setItems(shuffled);
    onOrderChange(shuffled.map((item) => item.id));
  }, [sequence]);

  const moveItem = (index: number, direction: 'up' | 'down') => {
    if (isAnswered) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const newItems = [...items];
    const [moved] = newItems.splice(index, 1);
    newItems.splice(targetIndex, 0, moved);
    setItems(newItems);
    onOrderChange(newItems.map((item) => item.id));
  };

  // 正解順のアイテムリスト
  const correctItems = (sequence.correctOrder || []).map((id) =>
    sequence.items.find((item) => item.id === id) || { id, text: id }
  );

  return (
    <div className="w-full space-y-2.5 my-2">
      {!isAnswered && (
        <div className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
          「▲」「▼」ボタンで正しい順番に並べ替えてください
        </div>
      )}

      {/* シンプルで安定したアイテムリスト */}
      <div className="space-y-2 w-full">
        {items.map((item, index) => {
          const isCorrectPosition =
            isAnswered && sequence.correctOrder?.[index] === item.id;

          let cardStyle =
            'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100';

          if (isAnswered) {
            if (isCorrectPosition) {
              cardStyle =
                'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 ring-1 ring-emerald-500/30';
            } else {
              cardStyle =
                'border-rose-400 bg-rose-50/80 dark:bg-rose-950/40 text-rose-900 dark:text-rose-100';
            }
          }

          return (
            <div
              key={item.id}
              className={`p-2.5 sm:p-3 rounded-2xl border-2 flex items-center justify-between shadow-sm select-none transition-colors ${cardStyle}`}
            >
              {/* 順位番号とテキスト */}
              <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0 mr-2">
                <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-black flex items-center justify-center shrink-0">
                  {index + 1}
                </span>
                <span className="font-bold text-xs sm:text-sm truncate">
                  {item.text}
                </span>
              </div>

              {/* 移動操作ボタン または 正誤アイコン */}
              <div className="flex items-center gap-1 shrink-0">
                {isAnswered ? (
                  isCorrectPosition ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                  )
                ) : (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveItem(index, 'up')}
                      disabled={index === 0}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-20 disabled:pointer-events-none transition active:scale-95"
                      aria-label="上に移動"
                    >
                      <span className="text-xs font-bold">▲</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => moveItem(index, 'down')}
                      disabled={index === items.length - 1}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-20 disabled:pointer-events-none transition active:scale-95"
                      aria-label="下に移動"
                    >
                      <span className="text-xs font-bold">▼</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 回答確定後：正しい順番との比較表示 */}
      {isAnswered && (
        <div className="mt-3 p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs">
          <div className="font-extrabold text-blue-600 dark:text-blue-400 mb-1.5 flex items-center gap-1">
            <span>【正しい順番】</span>
          </div>
          <div className="space-y-1">
            {correctItems.map((item, idx) => (
              <div key={item.id} className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                <span className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <span className="font-medium text-xs">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
