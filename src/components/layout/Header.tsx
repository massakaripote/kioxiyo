import React from 'react';
import { Moon, Sun, Monitor, Settings, Upload, BarChart3 } from 'lucide-react';
import type { ThemeMode } from '@/hooks/useTheme';

interface HeaderProps {
  breadcrumbs?: string[];
  theme: ThemeMode;
  onToggleTheme: () => void;
  onOpenSettings: () => void;
  onOpenImport: () => void;
  onOpenProgress: () => void;
  onHomeClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  breadcrumbs,
  theme,
  onToggleTheme,
  onOpenSettings,
  onOpenImport,
  onOpenProgress,
  onHomeClick,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-4xl mx-auto px-4 py-2">
        {/* 上部：横幅いっぱいに伸ばしたパンくずリスト */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1 pb-1 whitespace-nowrap overflow-x-auto no-scrollbar">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span className="opacity-50 shrink-0">&gt;</span>}
                <span className={`shrink-0 ${idx === breadcrumbs.length - 1 ? 'text-blue-600 dark:text-blue-400 font-semibold' : ''}`}>
                  {crumb}
                </span>
              </React.Fragment>
            ))}
          </div>
        )}

        {/* 下部：アプリタイトルと各アイコンの高さを揃えて配置 */}
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={onHomeClick}
            className="text-left group flex items-center gap-2 transition focus:outline-none"
          >
            <span className="font-extrabold tracking-wider text-xl sm:text-2xl text-slate-900 dark:text-white font-mono group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-none">
              KIOXIYO
            </span>
          </button>

          {/* アクションボタン */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={onOpenProgress}
              title="習得状況・履歴"
              className="p-1.5 sm:p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              <BarChart3 className="w-5 h-5" />
            </button>

            <button
              onClick={onOpenImport}
              title="問題インポート・バックアップ"
              className="p-1.5 sm:p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              <Upload className="w-5 h-5" />
            </button>

            <button
              onClick={onToggleTheme}
              title="テーマ切り替え"
              className="p-1.5 sm:p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              {theme === 'light' ? (
                <Sun className="w-5 h-5 text-amber-500" />
              ) : theme === 'dark' ? (
                <Moon className="w-5 h-5 text-indigo-400" />
              ) : (
                <Monitor className="w-5 h-5 text-blue-500" />
              )}
            </button>

            <button
              onClick={onOpenSettings}
              title="設定"
              className="p-1.5 sm:p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

