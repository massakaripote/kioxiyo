import React, { useState, useEffect, useCallback } from 'react';
import { db } from './db';
import {
  initializeDatabase,
  reloadInitialData,
  recordAnswer,
  getQuestionsForStudy,
  getSubjectProgress,
  getTodaySummary,
} from './db/studyService';
import type {
  SubjectType,
  Question,
  Unit,
  StudyMode,
  QuestionStudyType,
} from './types/database';
import { SUBJECTS } from './types/database';
import { useTheme } from './hooks/useTheme';
import { useSettings } from './hooks/useSettings';

import { Header } from './components/layout/Header';
import { SummaryCards } from './components/home/SummaryCards';
import { SubjectCards, type SubjectStats } from './components/home/SubjectCards';
import { UnitSelector } from './components/home/UnitSelector';
import { SwipeStudy } from './components/study/SwipeStudy';
import { ChoiceStudy } from './components/study/ChoiceStudy';
import { WrittenStudy } from './components/study/WrittenStudy';
import { ResultView, type AnswerResultItem } from './components/study/ResultView';
import { ImportExportModal } from './components/import/ImportExportModal';
import { ProgressView } from './components/progress/ProgressView';
import { SettingsModal } from './components/settings/SettingsModal';
import { AddQuestionModal } from './components/home/AddQuestionModal';
import { CommunityView } from './components/community/CommunityView';

import { Users, Globe, BookOpen, Sparkles } from 'lucide-react';

export function App() {
  const { theme, toggleTheme, setTheme } = useTheme();
  const { settings, updateSettings, setIsSwipeReversed } = useSettings();

  // 画面遷移状態
  const [currentView, setCurrentView] = useState<
    'home' | 'study_swipe' | 'study_choice' | 'study_written' | 'result'
  >('home');

  // 科目・単元・学習設定
  const [selectedSubject, setSelectedSubject] = useState<SubjectType>('歴史');
  const [selectedUnit, setSelectedUnit] = useState<string>('すべて');
  const [studyMode, setStudyMode] = useState<StudyMode>('all');
  const [studyType, setStudyType] = useState<QuestionStudyType>('swipe');

  // データ状態
  const [units, setUnits] = useState<Unit[]>([]);
  const [availableCount, setAvailableCount] = useState<number>(0);
  const [todayStats, setTodayStats] = useState({
    todayCount: 0,
    correctRate: 0,
    reviewWaitingCount: 0,
  });
  const [subjectStatsMap, setSubjectStatsMap] = useState<Record<SubjectType, SubjectStats>>({
    地理: { total: 0, unseen: 0, learning: 0, mastered: 0, correctRate: 0, reviewCount: 0 },
    歴史: { total: 0, unseen: 0, learning: 0, mastered: 0, correctRate: 0, reviewCount: 0 },
    公共: { total: 0, unseen: 0, learning: 0, mastered: 0, correctRate: 0, reviewCount: 0 },
    地学: { total: 0, unseen: 0, learning: 0, mastered: 0, correctRate: 0, reviewCount: 0 },
  });

  // 学習実行中の状態
  const [studyQuestions, setStudyQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [studyResults, setStudyResults] = useState<AnswerResultItem[]>([]);

  // モーダル状態
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isProgressOpen, setIsProgressOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddQuestionOpen, setIsAddQuestionOpen] = useState(false);
  const [isCommunityOpen, setIsCommunityOpen] = useState(false);
  const [communityDefaultTab, setCommunityDefaultTab] = useState<'problemSets' | 'currentAffairs'>('problemSets');

  // 初期化ロード
  const refreshAllData = useCallback(async () => {
    await initializeDatabase();

    // 単元一覧の取得
    const uList = await db.units.where('subject').equals(selectedSubject).sortBy('orderIndex');
    setUnits(uList);

    // 今日サマリー
    const tStats = await getTodaySummary();
    setTodayStats(tStats);

    // 科目別サマリー
    const sMap: any = {};
    for (const sub of SUBJECTS) {
      sMap[sub] = await getSubjectProgress(sub);
    }
    setSubjectStatsMap(sMap);

    // 出題可能問題数の計算
    const qs = await getQuestionsForStudy({
      subject: selectedSubject,
      unit: selectedUnit,
      mode: studyMode,
      studyType,
    });
    setAvailableCount(qs.length);
  }, [selectedSubject, selectedUnit, studyMode, studyType]);

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  // 単元追加ハンドラ
  const handleAddUnit = async (unitName: string) => {
    await db.units.add({
      id: `unit-${Date.now()}`,
      subject: selectedSubject,
      name: unitName,
      orderIndex: units.length + 1,
    });
    setSelectedUnit(unitName);
    refreshAllData();
  };

  // 学習開始
  const handleStartStudy = async () => {
    const qs = await getQuestionsForStudy({
      subject: selectedSubject,
      unit: selectedUnit,
      mode: studyMode,
      studyType,
    });

    if (qs.length === 0) return;

    setStudyQuestions(qs);
    setCurrentIndex(0);
    setStudyResults([]);

    if (studyType === 'swipe') setCurrentView('study_swipe');
    else if (studyType === 'multiple_choice') setCurrentView('study_choice');
    else if (studyType === 'written') setCurrentView('study_written');
  };

  // 各問題の回答記録ハンドラ
  const handleQuestionAnswer = async (confidence: boolean, isCorrect: boolean, userAnswer?: string) => {
    const q = studyQuestions[currentIndex];
    if (!q) return;

    const res = await recordAnswer({
      questionId: q.id,
      studyType,
      confidence,
      isCorrect,
      userAnswer,
    });

    const resultItem: AnswerResultItem = {
      question: q,
      confidence,
      isCorrect,
      pointsBefore: res.pointsBefore,
      pointsAfter: res.pointsAfter,
    };

    const newResults = [...studyResults, resultItem];
    setStudyResults(newResults);

    if (currentIndex + 1 < studyQuestions.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // 全問終了 -> リザルト画面へ
      setCurrentView('result');
      refreshAllData();
    }
  };

  // お気に入り切り替え
  const handleToggleFavorite = async (questionId: string) => {
    const q = await db.questions.get(questionId);
    if (q) {
      const nextFav = !q.isFavorite;
      await db.questions.update(questionId, { isFavorite: nextFav });
      setStudyQuestions((prev) =>
        prev.map((item) => (item.id === questionId ? { ...item, isFavorite: nextFav } : item))
      );
    }
  };

  // 間違えた問題の復習
  const handleReviewMistakes = (mistakeQuestions: Question[]) => {
    setStudyQuestions(mistakeQuestions);
    setCurrentIndex(0);
    setStudyResults([]);
    if (studyType === 'swipe') setCurrentView('study_swipe');
    else if (studyType === 'multiple_choice') setCurrentView('study_choice');
    else if (studyType === 'written') setCurrentView('study_written');
  };

  // 次の単元へ進む
  const handleNextUnit = () => {
    const currIdx = units.findIndex((u) => u.name === selectedUnit);
    if (currIdx >= 0 && currIdx + 1 < units.length) {
      setSelectedUnit(units[currIdx + 1].name);
    } else if (units.length > 0) {
      setSelectedUnit(units[0].name);
    }
    setCurrentView('home');
    refreshAllData();
  };

  // パンくずリスト生成
  const getBreadcrumbs = () => {
    const typeLabel =
      studyType === 'swipe' ? 'フラッシュ' : studyType === 'multiple_choice' ? '四択' : '記述';
    if (currentView === 'home') return ['ホーム'];
    if (currentView.startsWith('study_')) {
      return ['ホーム', selectedSubject, `${selectedUnit} (${typeLabel})`];
    }
    if (currentView === 'result') {
      return ['ホーム', selectedSubject, `${selectedUnit} (${typeLabel})`, 'リザルト'];
    }
    return ['ホーム'];
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* 共通ヘッダー */}
      <Header
        breadcrumbs={getBreadcrumbs()}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenImport={() => setIsImportOpen(true)}
        onOpenProgress={() => setIsProgressOpen(true)}
        onHomeClick={() => {
          setCurrentView('home');
          refreshAllData();
        }}
      />

      {/* メインコンテンツ */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-3 sm:px-4 pb-12">
        {currentView === 'home' && (
          <div>
            {/* 上部サマリーカード（今日10問 / 正答率70% / 復習待ち3問） */}
            <SummaryCards
              todayCount={todayStats.todayCount}
              correctRate={todayStats.correctRate}
              reviewWaitingCount={todayStats.reviewWaitingCount}
              onReviewClick={() => {
                setStudyMode('review');
                handleStartStudy();
              }}
            />

            {/* 科目選択カード（地理・歴史・公共・地学） */}
            <SubjectCards
              selectedSubject={selectedSubject}
              onSelectSubject={(sub) => {
                setSelectedSubject(sub);
                setSelectedUnit('すべて');
              }}
              statsMap={subjectStatsMap}
            />

            {/* 単元選択・出し方・回答方法 */}
            <UnitSelector
              subject={selectedSubject}
              units={units}
              selectedUnit={selectedUnit}
              onSelectUnit={setSelectedUnit}
              studyMode={studyMode}
              onSelectStudyMode={setStudyMode}
              studyType={studyType}
              onSelectStudyType={setStudyType}
              onStartStudy={handleStartStudy}
              onOpenAddQuestion={() => setIsAddQuestionOpen(true)}
              onAddUnit={handleAddUnit}
              availableCount={availableCount}
            />

            {/* 下部共有・時事コミュニティバナー */}
            <div className={`grid gap-3 mt-4 ${selectedSubject === '地理' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
              <div
                onClick={() => {
                  setCommunityDefaultTab('problemSets');
                  setIsCommunityOpen(true);
                }}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 transition cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
                      問題集の共有コミュニティ
                    </h4>
                    <p className="text-xs text-slate-400">全国の高校生が作成した問題集を探す</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-lg">
                  共有
                </span>
              </div>

              {selectedSubject === '地理' && (
                <div
                  onClick={() => {
                    setCommunityDefaultTab('currentAffairs');
                    setIsCommunityOpen(true);
                  }}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 transition cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
                        地理の最新・時事問題予測掲示板
                      </h4>
                      <p className="text-xs text-slate-400">定期テストに出る最新ニュースと地誌</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg">
                    時事
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* スワイプ式学習画面 */}
        {currentView === 'study_swipe' && (
          <SwipeStudy
            questions={studyQuestions}
            currentIndex={currentIndex}
            isSwipeReversed={settings.isSwipeReversed}
            onToggleReverse={() => setIsSwipeReversed(!settings.isSwipeReversed)}
            onAnswer={handleQuestionAnswer}
            onToggleFavorite={handleToggleFavorite}
            onExit={() => {
              setCurrentView('home');
              refreshAllData();
            }}
          />
        )}

        {/* 四択式学習画面 */}
        {currentView === 'study_choice' && (
          <ChoiceStudy
            questions={studyQuestions}
            currentIndex={currentIndex}
            isSwipeReversed={settings.isSwipeReversed}
            onToggleReverse={() => setIsSwipeReversed(!settings.isSwipeReversed)}
            onAnswer={handleQuestionAnswer}
            onToggleFavorite={handleToggleFavorite}
            onExit={() => {
              setCurrentView('home');
              refreshAllData();
            }}
          />
        )}

        {/* 記述式学習画面 */}
        {currentView === 'study_written' && (
          <WrittenStudy
            questions={studyQuestions}
            currentIndex={currentIndex}
            onAnswer={handleQuestionAnswer}
            onToggleFavorite={handleToggleFavorite}
            onExit={() => {
              setCurrentView('home');
              refreshAllData();
            }}
          />
        )}

        {/* リザルト画面 */}
        {currentView === 'result' && (
          <ResultView
            results={studyResults}
            onReviewMistakes={handleReviewMistakes}
            onNextUnit={handleNextUnit}
            onHome={() => {
              setCurrentView('home');
              refreshAllData();
            }}
          />
        )}
      </main>

      {/* モーダル群 */}
      <ImportExportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onDataChanged={refreshAllData}
      />

      <ProgressView
        isOpen={isProgressOpen}
        onClose={() => setIsProgressOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        theme={theme}
        onThemeChange={setTheme}
        onUpdateSettings={updateSettings}
        onReloadInitialData={async () => {
          await reloadInitialData();
          await refreshAllData();
        }}
      />

      <AddQuestionModal
        isOpen={isAddQuestionOpen}
        onClose={() => setIsAddQuestionOpen(false)}
        defaultSubject={selectedSubject}
        defaultUnit={selectedUnit}
        onQuestionAdded={refreshAllData}
      />

      <CommunityView
        isOpen={isCommunityOpen}
        onClose={() => setIsCommunityOpen(false)}
        authorName={settings.authorName}
        onCopiedSuccess={refreshAllData}
        defaultTab={communityDefaultTab}
      />
    </div>
  );
}
