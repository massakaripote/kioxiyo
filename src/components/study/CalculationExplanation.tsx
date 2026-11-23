import React from 'react';
import type { CalculationData } from '@/types/database';
import { Calculator } from 'lucide-react';

interface CalculationExplanationProps {
  calculation: CalculationData;
  className?: string;
}

export const CalculationExplanation: React.FC<CalculationExplanationProps> = ({
  calculation,
  className = '',
}) => {
  if (!calculation) return null;
  const { formula, steps, tolerance, unit } = calculation;

  if (!formula && (!steps || steps.length === 0) && tolerance === undefined) {
    return null;
  }

  return (
    <div className={`mt-2 p-3 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 text-xs sm:text-sm space-y-2 ${className}`}>
      <div className="flex items-center gap-1.5 font-bold text-blue-700 dark:text-blue-300 text-xs">
        <Calculator className="w-3.5 h-3.5 shrink-0" />
        <span>計算過程・公式</span>
        {tolerance !== undefined && tolerance > 0 && (
          <span className="ml-auto text-[10px] font-semibold text-slate-500 dark:text-slate-400">
            許容誤差: ±{tolerance}{unit || ''}
          </span>
        )}
      </div>

      {formula && (
        <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-blue-100 dark:border-blue-900 font-mono text-[11px] sm:text-xs text-blue-900 dark:text-blue-200">
          <span className="text-[10px] text-slate-400 block font-sans mb-0.5">【使用する公式】</span>
          {formula}
        </div>
      )}

      {steps && steps.length > 0 && (
        <div className="space-y-1">
          <span className="text-[10px] text-slate-400 block font-sans">【計算手順】</span>
          <ol className="list-decimal list-inside space-y-0.5 text-[11px] sm:text-xs font-mono text-slate-700 dark:text-slate-300">
            {steps.map((step, idx) => (
              <li key={idx} className="leading-relaxed">
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
};
