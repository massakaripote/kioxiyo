import React, { useState } from 'react';
import type { UserSettings } from '@/types/database';
import type { ThemeMode } from '@/hooks/useTheme';
import { X, User, Moon, Sun, Monitor, AlertCircle, Info, RefreshCw, Check } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  onReloadInitialData: () => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  theme,
  onThemeChange,
  onUpdateSettings,
  onReloadInitialData,
}) => {
  const [authorNameInput, setAuthorNameInput] = useState(settings.authorName || '');
  const [savedNotice, setSavedNotice] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const [reloadNotice, setReloadNotice] = useState(false);

  if (!isOpen) return null;

  const handleSaveAuthorName = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({ authorName: authorNameInput.trim() });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  const handleReloadClick = async () => {
    const ok = window.confirm(
      '初期問題データを最新の状態ですべて再読み込みしますか？\n（コード上で更新した問題や選択肢が反映されます）'
    );
    if (!ok) return;

    setIsReloading(true);
    try {
      await onReloadInitialData();
      setReloadNotice(true);
      setTimeout(() => setReloadNotice(false), 2500);
    } catch (err) {
      console.error(err);
      alert('再読み込み中にエラーが発生しました');
    } finally {
      setIsReloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* ヘッダー */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
            アプリ設定
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-5 space-y-5 overflow-y-auto max-h-[80vh]">
          {/* 投稿者名設定 */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              投稿者名（問題共有・時事問題での表示名）
            </label>
            <form onSubmit={handleSaveAuthorName} className="flex gap-2">
              <input
                type="text"
                value={authorNameInput}
                onChange={(e) => setAuthorNameInput(e.target.value)}
                placeholder="例: 高校生A, レキシー"
                className="flex-1 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition"
              >
                保存
              </button>
            </form>
            {savedNotice && (
              <p className="text-xs text-emerald-600 font-bold mt-1">保存しました！</p>
            )}
          </div>

          {/* テーマ設定 */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              カラーテーマ
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'light', label: 'ライト', icon: Sun },
                { id: 'dark', label: 'ダーク', icon: Moon },
                { id: 'system', label: '端末追従', icon: Monitor },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = theme === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onThemeChange(item.id as ThemeMode)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${isSelected
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 左右反転デフォルト */}
          <div>
            <label className="flex items-center gap-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.isSwipeReversed}
                onChange={(e) => onUpdateSettings({ isSwipeReversed: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
              />
              <span>スワイプ操作の初期設定を左右反転にする</span>
            </label>
            <p className="text-[11px] text-slate-400 mt-1 pl-6">
              左利きの方や、親指の届きやすさに合わせて通常「自信ナシ/間違い」の左を「自信アリ/正解」に入れ替えます。
            </p>
          </div>

          {/* 端末ごとのユーザー管理の説明（プロンプト第3-2項） */}
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-300 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold">
              <Info className="w-4 h-4 shrink-0 text-amber-600" />
              <span>端末・ブラウザごとのデータについて</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-400">
              KIOXIYOは個人の学習記録をすべてお使いの端末内（IndexedDB）に安全に保存しています。PCとスマホでデータは自動共有されません。端末の変更やブラウザデータの削除を行う前に、「データ管理」からバックアップ（JSONエクスポート）を行ってください。
            </p>
          </div>

          {/* 問題データの再読み込み */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              問題データの再読み込み
            </label>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2.5">
              initialData.ts などのソースコードで編集した問題文・選択肢・解答をアプリ内に最新反映します。※達成度データなどは消去されます。
            </p>
            <button
              type="button"
              onClick={handleReloadClick}
              disabled={isReloading}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isReloading ? 'animate-spin text-blue-600' : ''}`} />
              <span>{isReloading ? '再読み込み中...' : '問題をすべて読み込み直す'}</span>
            </button>
            {reloadNotice && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-2 flex items-center gap-1 justify-center">
                <Check className="w-4 h-4" />
                <span>最新の問題データを正常に再読み込みしました！</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

