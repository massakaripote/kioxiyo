import React, { useState } from 'react';
import yaml from 'js-yaml';
import { db } from '@/db';
import type { Question, SubjectType, QuestionStudyType } from '@/types/database';
import { X, Upload, Download, Check, AlertTriangle, FileText, Database, Copy, CheckCheck } from 'lucide-react';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataChanged: () => void;
}

interface ParsedUnitGroup {
  subject: SubjectType;
  unit: string;
  questions: Question[];
}

// ── AIプロンプトテンプレート ──
// ここを編集すれば「AIプロンプトをコピー」ボタンで
// クリップボードにコピーされるテキストが変わります。
const AI_PROMPT_TEMPLATE = `- subject: (教科名：地理 / 歴史 / 公共 / 地学 のうちどれか)
  unit: (単元名やテーマを記述)
  questions:
    - question: (ここに問題文を入力)
      answer: (ここに正解となる答えを入力)
      choices:
        - (選択肢1：正解または不正解の選択肢)
        - (選択肢2)
        - (選択肢3)
        - (選択肢4)
      explanation: (ここに問題の解説や背景知識を入力)
      keywords:
        - (関連するキーワード1)
        - (関連するキーワード2)

    - question: (2問目以降も同様の形式で追加)
      answer: (答え)
      choices:
        - (選択肢1)
        - (選択肢2)
        - (選択肢3)
        - (選択肢4)
      explanation: (解説)
      keywords:
        - (キーワード1)

このYAML形式のテキストに則って問題を作成し、YAML形式のテキストを出力して。
#留意点
・anwerとchoicesが対応することを確認し、choicesの中にanswerと同じものが無いようなことが起こらないようにする。
`;

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
  onDataChanged,
}) => {
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');
  const [importText, setImportText] = useState('');
  const [previewGroups, setPreviewGroups] = useState<ParsedUnitGroup[] | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);

  // AIプロンプトをクリップボードにコピー
  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(AI_PROMPT_TEMPLATE);
      setPromptCopied(true);
      setTimeout(() => setPromptCopied(false), 2000);
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = AI_PROMPT_TEMPLATE;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setPromptCopied(true);
      setTimeout(() => setPromptCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  // テキスト検証とプレビュー生成（複数単元・複数教科および従来形式の両方に対応）
  const handleValidate = () => {
    setErrorMsg(null);
    setPreviewGroups(null);

    if (!importText.trim()) {
      setErrorMsg('インポートするテキストを入力してください。');
      return;
    }

    try {
      let parsed: any;
      if (importText.trim().startsWith('{') || importText.trim().startsWith('[')) {
        parsed = JSON.parse(importText);
      } else {
        parsed = yaml.load(importText);
      }

      if (!parsed || (typeof parsed !== 'object')) {
        throw new Error('データ形式が正しくありません。');
      }

      const validSubjects: SubjectType[] = ['地理', '歴史', '公共', '地学'];

      // 入力データをグループ配列の形に正規化
      let rawGroups: any[] = [];

      if (Array.isArray(parsed)) {
        // パターンA: トップレベルが配列 [ { subject, unit, questions }, ... ]
        rawGroups = parsed;
      } else if (Array.isArray(parsed.units)) {
        // パターンB: { units: [ { subject, unit, questions }, ... ] }
        rawGroups = parsed.units;
      } else if (parsed.subject && parsed.unit && Array.isArray(parsed.questions)) {
        // パターンC: 単一グループ（従来の形式 { subject, unit, questions }）
        rawGroups = [parsed];
      } else {
        throw new Error(
          'データ構造が認識できません。「units」のリスト形式、または単一の「subject / unit / questions」を指定してください。'
        );
      }

      const groups: ParsedUnitGroup[] = [];
      let totalQuestionCount = 0;

      for (let gIdx = 0; gIdx < rawGroups.length; gIdx++) {
        const g = rawGroups[gIdx];
        if (!g.subject || !g.unit || !Array.isArray(g.questions)) {
          throw new Error(`単元グループ #${gIdx + 1} に subject, unit, questions が必要です。`);
        }

        if (!validSubjects.includes(g.subject)) {
          throw new Error(
            `単元グループ「${g.unit}」の科目が無効です。「地理」「歴史」「公共」「地学」のいずれかを指定してください（指定値: ${g.subject}）。`
          );
        }

        const questions: Question[] = g.questions.map((q: any, i: number) => {
          if (!q.question || !q.answer) {
            throw new Error(`「${g.unit}」の問題 #${i + 1} に question または answer がありません。`);
          }
          return {
            id: q.id || `${g.subject.slice(0, 2)}-${Date.now()}-${gIdx}-${i}`,
            subject: g.subject,
            unit: g.unit,
            question: q.question,
            answer: q.answer,
            choices: Array.isArray(q.choices) && q.choices.length > 0 ? q.choices : [q.answer],
            explanation: q.explanation || '',
            keywords: Array.isArray(q.keywords) ? q.keywords : [],
            type: (q.type as QuestionStudyType[]) || ['swipe', 'multiple_choice', 'written'],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
        });

        totalQuestionCount += questions.length;
        groups.push({
          subject: g.subject,
          unit: g.unit,
          questions,
        });
      }

      if (groups.length === 0 || totalQuestionCount === 0) {
        throw new Error('インポート対象の問題が見つかりませんでした。');
      }

      setPreviewGroups(groups);
    } catch (e: any) {
      setErrorMsg(e.message || 'フォーマットの解析に失敗しました。');
    }
  };

  // ファイル読み込み
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportText(content);
    };
    reader.readAsText(file);
  };

  // インポート実行（複数単元・複数教科を一括保存）
  const handleExecuteImport = async () => {
    if (!previewGroups || previewGroups.length === 0) return;

    try {
      for (const group of previewGroups) {
        // 問題の登録/更新
        for (const q of group.questions) {
          await db.questions.put(q);
          const stat = await db.masteryStats.get(q.id);
          if (!stat) {
            await db.masteryStats.add({
              questionId: q.id,
              points: 0,
              status: 'unseen',
              timesAsked: 0,
              correctCount: 0,
              incorrectCount: 0,
              isWeak: false,
            });
          }
        }

        // 単元の追加（存在しない場合）
        const existingUnit = await db.units
          .where('subject')
          .equals(group.subject)
          .and((u) => u.name === group.unit)
          .first();

        if (!existingUnit) {
          const currentCount = await db.units.where('subject').equals(group.subject).count();
          await db.units.add({
            id: `unit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            subject: group.subject,
            name: group.unit,
            orderIndex: currentCount + 1,
          });
        }
      }

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setPreviewGroups(null);
        setImportText('');
        onDataChanged();
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(`インポート保存エラー: ${err.message}`);
    }
  };

  // 全データJSONエクスポート
  const handleExportAll = async () => {
    const questions = await db.questions.toArray();
    const units = await db.units.toArray();
    const masteryStats = await db.masteryStats.toArray();
    const studyLogs = await db.studyLogs.toArray();

    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      questions,
      units,
      masteryStats,
      studyLogs,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kioxiyo-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // バックアップ復元
  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('既存のデータに追加・復元します。よろしいですか？')) {
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.questions) await db.questions.bulkPut(parsed.questions);
        if (parsed.units) await db.units.bulkPut(parsed.units);
        if (parsed.masteryStats) await db.masteryStats.bulkPut(parsed.masteryStats);
        if (parsed.studyLogs) await db.studyLogs.bulkPut(parsed.studyLogs);

        alert('バックアップの復元が完了しました！');
        onDataChanged();
        onClose();
      } catch (err: any) {
        alert(`復元に失敗しました: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* モーダルヘッダー */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
              データ管理・インポート / バックアップ
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* タブ切り替え */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-5 pt-2">
          <button
            onClick={() => setActiveTab('import')}
            className={`pb-2.5 px-4 font-bold text-sm border-b-2 transition ${activeTab === 'import'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
          >
            問題の一括インポート (YAML / JSON)
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`pb-2.5 px-4 font-bold text-sm border-b-2 transition ${activeTab === 'export'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
          >
            バックアップと復元
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'import' ? (
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                ChatGPT等のAIで生成した問題や、YAML・JSON形式のテキストを貼り付けて一括登録できます。
              </p>

              <div className="flex items-center gap-2 mb-2">
                <label className="cursor-pointer text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline">
                  <Upload className="w-3.5 h-3.5" />
                  <span>ファイルを読み込む (.yaml, .json, .txt)</span>
                  <input
                    type="file"
                    accept=".yaml,.yml,.json,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <textarea
                rows={7}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder={`# 複数単元・教科をまとめて追加する例:\nunits:\n  - subject: 歴史\n    unit: 江戸時代の対外関係\n    questions:\n      - question: 1637年に島原・天草で起きた一揆は？\n        answer: 島原・天草一揆\n        choices: [島原・天草一揆, 徳政一揆, 大塩平八郎の乱, 山城の国一揆]\n  - subject: 公共\n    unit: 基本的人権の保障\n    questions:\n      - question: 憲法第13条が保障する個人の尊重と幸福追求の権利は？\n        answer: 幸福追求権\n        choices: [幸福追求権, 生存権, 参政権, 平等権]`}
                className="w-full p-3 font-mono text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />

              <div className="mt-2 flex gap-2">
                <button
                  onClick={handleValidate}
                  className="px-4 py-2 bg-slate-800 dark:bg-slate-700 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition"
                >
                  データ形式を検証・プレビュー
                </button>
                <button
                  onClick={handleCopyPrompt}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${promptCopied
                    ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                    : 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 border border-violet-300 dark:border-violet-700 hover:bg-violet-200 dark:hover:bg-violet-800/40'
                    }`}
                >
                  {promptCopied ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{promptCopied ? 'コピーしました！' : 'AI用プロンプトをコピー'}</span>
                </button>
              </div>

              {errorMsg && (
                <div className="mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {previewGroups && (
                <div className="mt-4 p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-blue-700 dark:text-blue-300">
                      インポートプレビュー
                    </span>
                    <span className="text-xs font-extrabold text-blue-800 dark:text-blue-200">
                      計 {previewGroups.reduce((acc, g) => acc + g.questions.length, 0)}問 / {previewGroups.length}単元 検出
                    </span>
                  </div>

                  <div className="max-h-52 overflow-y-auto space-y-3 pr-1 border-t border-blue-200/50 dark:border-blue-900/50 pt-2 text-xs">
                    {previewGroups.map((group, gIdx) => (
                      <div key={gIdx} className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-slate-900 dark:text-white">
                            【{group.subject}】 {group.unit}
                          </span>
                          <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-md">
                            {group.questions.length}問
                          </span>
                        </div>
                        <div className="space-y-1 pl-1">
                          {group.questions.map((q, qIdx) => (
                            <div key={qIdx} className="text-[11px] text-slate-600 dark:text-slate-300">
                              ・{q.question} <span className="text-blue-600 font-semibold">(答: {q.answer})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleExecuteImport}
                    className="w-full mt-3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-1.5"
                  >
                    {isSuccess ? <Check className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                    <span>
                      {isSuccess
                        ? 'インポート完了！'
                        : `全${previewGroups.reduce((acc, g) => acc + g.questions.length, 0)}問を一括インポート実行`}
                    </span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1 flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-emerald-500" />
                  端末データのバックアップ (JSONエクスポート)
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  全問題データ、学習履歴、習得ポイントを1つのJSONファイルとして端末にダウンロード保存します。
                </p>
                <button
                  onClick={handleExportAll}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>全データをダウンロード</span>
                </button>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1 flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-blue-500" />
                  バックアップからの復元 (JSONインポート)
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  過去にエクスポートしたバックアップJSONファイルから、問題や学習記録を復元します。
                </p>
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition">
                  <Upload className="w-4 h-4" />
                  <span>バックアップファイルを選択して復元</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleRestoreBackup}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

