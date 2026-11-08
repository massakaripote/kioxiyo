import React, { useState, useEffect } from 'react';
import {
  isFirebaseConfigured,
  getOrSignInUser,
  fetchPublicProblemSets,
  fetchUnlistedProblemSet,
  publishProblemSet,
  copyProblemSetToLocal,
  fetchCurrentAffairs,
  publishCurrentAffair,
  deleteCurrentAffair,
  deleteProblemSet,
  submitReport,
} from '@/services/firebase';
import type { SharedProblemSet, CurrentAffairPost } from '@/types/share';
import type { SubjectType, Question } from '@/types/database';
import { db as localDb } from '@/db';
import {
  X,
  Users,
  Globe,
  Upload,
  Download,
  AlertTriangle,
  Search,
  Plus,
  Share2,
  Check,
  ChevronDown,
  ChevronUp,
  Eye,
  Flag,
  Trash2,
} from 'lucide-react';

interface CommunityViewProps {
  isOpen: boolean;
  onClose: () => void;
  authorName: string;
  onCopiedSuccess: () => void;
  defaultTab?: 'problemSets' | 'currentAffairs';
}

export const CommunityView: React.FC<CommunityViewProps> = ({
  isOpen,
  onClose,
  authorName,
  onCopiedSuccess,
  defaultTab = 'problemSets',
}) => {
  const [activeTab, setActiveTab] = useState<'problemSets' | 'currentAffairs'>('problemSets');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
    }
  }, [isOpen, defaultTab]);

  // 問題共有
  const [problemSets, setProblemSets] = useState<SharedProblemSet[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('すべて');
  const [unlistedIdInput, setUnlistedIdInput] = useState('');
  const [isPostingSet, setIsPostingSet] = useState(false);
  const [myLocalQuestions, setMyLocalQuestions] = useState<Question[]>([]);

  // 投稿フォーム
  const [postTitle, setPostTitle] = useState('');
  const [postDesc, setPostDesc] = useState('');
  const [postSubject, setPostSubject] = useState<SubjectType>('歴史');
  const [postUnit, setPostUnit] = useState('');
  const [postIsPublic, setPostIsPublic] = useState(true);

  // 時事問題
  const [currentAffairs, setCurrentAffairs] = useState<CurrentAffairPost[]>([]);
  const [affairOrder, setAffairOrder] = useState<'desc' | 'asc'>('desc');
  const [expandedAffairId, setExpandedAffairId] = useState<string | null>(null);
  const [isPostingAffair, setIsPostingAffair] = useState(false);
  const [affairQuestion, setAffairQuestion] = useState('');
  const [affairAnswer, setAffairAnswer] = useState('');
  const [affairExplanation, setAffairExplanation] = useState('');
  const [affairCategory, setAffairCategory] = useState('国際情勢・環境');

  // 通報モーダル
  const [reportingTarget, setReportingTarget] = useState<{
    type: 'problemSet' | 'currentAffair';
    id: string;
  } | null>(null);
  const [reportReason, setReportReason] = useState('不適切な内容・誤情報');
  const [reportDetails, setReportDetails] = useState('');

  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (isFirebaseConfigured) {
      getOrSignInUser().then((u) => setUser(u));
    }

    loadData();
    localDb.questions.toArray().then((qs) => setMyLocalQuestions(qs));
  }, [isOpen, activeTab, selectedSubject, affairOrder]);

  const loadData = async () => {
    if (!isFirebaseConfigured) return;
    setLoading(true);
    try {
      if (activeTab === 'problemSets') {
        const sets = await fetchPublicProblemSets(selectedSubject);
        setProblemSets(sets);
      } else {
        const posts = await fetchCurrentAffairs(affairOrder);
        setCurrentAffairs(posts);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // 問題集のコピー
  const handleCopySet = async (sharedSet: SharedProblemSet) => {
    try {
      const count = await copyProblemSetToLocal(sharedSet);
      setNotice(`「${sharedSet.title}」から ${count}問 を端末に保存しました！`);
      setTimeout(() => setNotice(null), 3000);
      onCopiedSuccess();
    } catch (e: any) {
      alert(`コピーに失敗しました: ${e.message}`);
    }
  };

  // URL限定問題集の読み込み
  const handleLoadUnlisted = async () => {
    if (!unlistedIdInput.trim()) return;
    try {
      const found = await fetchUnlistedProblemSet(unlistedIdInput.trim());
      if (found) {
        setProblemSets([found, ...problemSets.filter((s) => s.id !== found.id)]);
        setNotice(`限定公開問題集「${found.title}」を取得しました`);
        setTimeout(() => setNotice(null), 3000);
      } else {
        alert('指定されたIDの問題集は見つかりませんでした。');
      }
    } catch (e: any) {
      alert(`取得失敗: ${e.message}`);
    }
  };

  // 問題集の投稿
  const handlePublishSet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('匿名認証の準備ができていません。');
      return;
    }
    const questionsToPost = myLocalQuestions.filter(
      (q) => q.subject === postSubject && (!postUnit || q.unit === postUnit)
    );

    if (questionsToPost.length === 0) {
      alert('投稿対象となる問題が端末内にありません。');
      return;
    }

    try {
      const id = await publishProblemSet(
        {
          title: postTitle.trim(),
          description: postDesc.trim(),
          subject: postSubject,
          unit: postUnit || '全般',
          questions: questionsToPost,
          authorName: authorName || '名無しの高校生',
          isPublic: postIsPublic,
        },
        user
      );

      setNotice(
        postIsPublic
          ? '一般公開で問題集を投稿しました！'
          : `URL限定公開で投稿しました（ID: ${id}）`
      );
      setIsPostingSet(false);
      setPostTitle('');
      setPostDesc('');
      loadData();
    } catch (err: any) {
      alert(`投稿エラー: ${err.message}`);
    }
  };

  // 時事問題の投稿
  const handlePublishAffair = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('匿名認証の準備ができていません。');
      return;
    }

    try {
      await publishCurrentAffair(
        {
          question: affairQuestion.trim(),
          answer: affairAnswer.trim(),
          explanation: affairExplanation.trim(),
          category: affairCategory,
          authorName: authorName || '名無しの高校生',
        },
        user
      );

      setNotice('地理の時事問題を投稿しました！');
      setIsPostingAffair(false);
      setAffairQuestion('');
      setAffairAnswer('');
      setAffairExplanation('');
      loadData();
    } catch (err: any) {
      alert(`投稿エラー: ${err.message}`);
    }
  };

  // 通報の送信
  const handleSendReport = async () => {
    if (!reportingTarget || !user) return;
    try {
      await submitReport(
        {
          targetType: reportingTarget.type,
          targetId: reportingTarget.id,
          reason: reportReason,
          details: reportDetails,
        },
        user
      );
      alert('通報を受け付けました。管理者が確認いたします。');
      setReportingTarget(null);
      setReportDetails('');
    } catch (e: any) {
      alert(`通報エラー: ${e.message}`);
    }
  };

  // 投稿の削除ハンドラ（投稿者本人）
  const handleDeletePost = async (type: 'problemSet' | 'currentAffair', id: string, isPublic = true) => {
    const ok = window.confirm('本当にこの投稿を削除しますか？\n（この操作は取り消せません）');
    if (!ok) return;

    try {
      if (type === 'currentAffair') {
        await deleteCurrentAffair(id);
        setNotice('時事問題の投稿を削除しました');
      } else {
        await deleteProblemSet(id, isPublic);
        setNotice('問題集の共有を削除しました');
      }
      loadData();
    } catch (err: any) {
      alert(`削除エラー: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* ヘッダー */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
              KIOXIYO 共有コミュニティ
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
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-5 pt-2">
          <button
            onClick={() => setActiveTab('problemSets')}
            className={`pb-2.5 px-4 font-bold text-sm border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'problemSets'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Share2 className="w-4 h-4" />
            <span>問題集の共有</span>
          </button>
          <button
            onClick={() => setActiveTab('currentAffairs')}
            className={`pb-2.5 px-4 font-bold text-sm border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'currentAffairs'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>地理の時事問題</span>
          </button>
        </div>

        {/* 通知バー */}
        {notice && (
          <div className="px-5 py-2 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        {/* Firebase設定案内（未接続時） */}
        {!isFirebaseConfigured ? (
          <div className="p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 mx-auto flex items-center justify-center">
              <Share2 className="w-6 h-6" />
            </div>
            <h4 className="font-extrabold text-base text-slate-800 dark:text-slate-200">
              Firebase接続の準備
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              KIOXIYOでは、学習データは全て端末内（IndexedDB）で安全に管理されています。問題共有・地理時事問題機能を利用するには、Firebase無料枠（Sparkプラン）の接続情報を <code className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[11px]">.env</code> に設定するだけで即座にオンライン共有が有効化されます。
            </p>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-left font-mono text-[11px] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 max-w-sm mx-auto">
              VITE_FIREBASE_API_KEY=...<br />
              VITE_FIREBASE_PROJECT_ID=...
            </div>
          </div>
        ) : (
          /* Firebase接続済みコンテンツ */
          <div className="p-5 overflow-y-auto flex-1 space-y-4">
            {activeTab === 'problemSets' ? (
              <div>
                {/* アクションバー */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">科目絞り込み:</span>
                    <select
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      className="px-2.5 py-1 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold"
                    >
                      <option value="すべて">全科目</option>
                      <option value="地理">地理</option>
                      <option value="歴史">歴史</option>
                      <option value="公共">公共</option>
                      <option value="地学">地学</option>
                    </select>
                  </div>

                  <button
                    onClick={() => setIsPostingSet(!isPostingSet)}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 transition shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>問題集を共有する</span>
                  </button>
                </div>

                {/* 投稿フォーム */}
                {isPostingSet && (
                  <form onSubmit={handlePublishSet} className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 mb-4 space-y-3">
                    <h5 className="font-extrabold text-xs text-blue-700 dark:text-blue-300">
                      作成した問題集を共有
                    </h5>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={postTitle}
                        onChange={(e) => setPostTitle(e.target.value)}
                        placeholder="問題集のタイトル (例: 定期テスト直前対策)"
                        required
                        className="px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                      />
                      <select
                        value={postSubject}
                        onChange={(e) => setPostSubject(e.target.value as SubjectType)}
                        className="px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold"
                      >
                        <option value="歴史">歴史</option>
                        <option value="地理">地理</option>
                        <option value="公共">公共</option>
                        <option value="地学">地学</option>
                      </select>
                    </div>
                    <textarea
                      rows={2}
                      value={postDesc}
                      onChange={(e) => setPostDesc(e.target.value)}
                      placeholder="問題集の簡単な説明..."
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                    />
                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={postIsPublic}
                          onChange={(e) => setPostIsPublic(e.target.checked)}
                          className="rounded text-blue-600"
                        />
                        <span>一般公開する（チェックを外すとURL限定公開）</span>
                      </label>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
                      >
                        投稿する
                      </button>
                    </div>
                  </form>
                )}

                {/* URL限定公開取得 */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 mb-3 flex gap-2">
                  <input
                    type="text"
                    value={unlistedIdInput}
                    onChange={(e) => setUnlistedIdInput(e.target.value)}
                    placeholder="URL限定問題集のIDを入力..."
                    className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl"
                  />
                  <button
                    onClick={handleLoadUnlisted}
                    className="px-3 py-1.5 bg-slate-800 dark:bg-slate-700 text-white rounded-xl text-xs font-bold"
                  >
                    限定問題集を取得
                  </button>
                </div>

                {/* 問題集一覧 */}
                <div className="space-y-3">
                  {problemSets.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs">
                      {loading ? '読み込み中...' : '共有された問題集はまだありません。あなたが最初に投稿してみましょう！'}
                    </div>
                  ) : (
                    problemSets.map((set) => (
                      <div
                        key={set.id}
                        className="p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 font-mono">
                              {set.subject} &gt; {set.unit}
                            </span>
                            <div className="flex items-center gap-1">
                              {user && set.authorUid === user.uid && (
                                <button
                                  onClick={() => handleDeletePost('problemSet', set.id, set.isPublic)}
                                  title="この問題集を削除"
                                  className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                </button>
                              )}
                              <button
                                onClick={() => setReportingTarget({ type: 'problemSet', id: set.id })}
                                title="不適切な投稿を通報"
                                className="text-slate-400 hover:text-rose-500 p-1"
                              >
                                <Flag className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mt-1">
                            {set.title}
                          </h4>
                          {set.description && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              {set.description}
                            </p>
                          )}
                          <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-2">
                            <span>投稿者: {set.authorName}</span>
                            <span>・</span>
                            <span>{set.questions.length}問 収録</span>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                          <button
                            onClick={() => handleCopySet(set)}
                            className="px-3.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-extrabold text-xs flex items-center gap-1.5 hover:bg-blue-100 transition"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>自分の端末にコピーして学習</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              /* 地理の時事問題 */
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">並び順:</span>
                    <button
                      onClick={() => setAffairOrder(affairOrder === 'desc' ? 'asc' : 'desc')}
                      className="px-2.5 py-1 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold"
                    >
                      {affairOrder === 'desc' ? '新着順' : '古い順'}
                    </button>
                  </div>

                  <button
                    onClick={() => setIsPostingAffair(!isPostingAffair)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 transition shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>時事問題を投稿する</span>
                  </button>
                </div>

                {isPostingAffair && (
                  <form onSubmit={handlePublishAffair} className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 mb-4 space-y-3">
                    <h5 className="font-extrabold text-xs text-emerald-700 dark:text-emerald-300">
                      地理の最新時事問題を投稿
                    </h5>
                    <textarea
                      rows={2}
                      value={affairQuestion}
                      onChange={(e) => setAffairQuestion(e.target.value)}
                      placeholder="問題文 (例: 2024年にCOP29が開催されたアゼルバイジャンの首都は？)"
                      required
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                    />
                    <input
                      type="text"
                      value={affairAnswer}
                      onChange={(e) => setAffairAnswer(e.target.value)}
                      placeholder="正解 (例: バクー)"
                      required
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-emerald-400 font-bold"
                    />
                    <textarea
                      rows={2}
                      value={affairExplanation}
                      onChange={(e) => setAffairExplanation(e.target.value)}
                      placeholder="解説や地理的背景..."
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                    />
                    <div className="flex justify-end pt-1">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold"
                      >
                        即時公開する
                      </button>
                    </div>
                  </form>
                )}

                {/* 時事問題リスト */}
                <div className="space-y-3">
                  {currentAffairs.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs">
                      {loading ? '読み込み中...' : '地理の時事問題はまだありません。'}
                    </div>
                  ) : (
                    currentAffairs.map((post) => {
                      const isExpanded = expandedAffairId === post.id;
                      return (
                        <div
                          key={post.id}
                          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
                              {post.category}
                            </span>
                            <div className="flex items-center gap-1">
                              {user && post.authorUid === user.uid && (
                                <button
                                  onClick={() => handleDeletePost('currentAffair', post.id)}
                                  title="この時事問題を削除"
                                  className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                </button>
                              )}
                              <button
                                onClick={() => setReportingTarget({ type: 'currentAffair', id: post.id })}
                                title="不適切な投稿を通報"
                                className="text-slate-400 hover:text-rose-500 p-1"
                              >
                                <Flag className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <div className="font-bold text-sm text-slate-900 dark:text-white mt-1">
                            Q. {post.question}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1">
                            投稿者: {post.authorName} ・ {new Date(post.createdAt).toLocaleDateString()}
                          </div>

                          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <button
                              onClick={() => setExpandedAffairId(isExpanded ? null : post.id)}
                              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 hover:underline"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>{isExpanded ? '解答・解説を閉じる' : '解答・解説を見る'}</span>
                            </button>

                            {isExpanded && (
                              <div className="mt-2 p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-900 text-xs">
                                <div className="font-black text-emerald-700 dark:text-emerald-300 text-sm mb-1">
                                  正解: {post.answer}
                                </div>
                                {post.explanation && (
                                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed border-t border-emerald-200/50 dark:border-emerald-900/50 pt-1">
                                    {post.explanation}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 通報ダイアログ */}
        {reportingTarget && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 max-w-sm w-full space-y-3">
              <div className="flex items-center gap-2 text-rose-600 font-extrabold text-sm">
                <Flag className="w-4 h-4" />
                <span>不適切な投稿の通報</span>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  通報理由
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full p-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold"
                >
                  <option value="不適切な内容・誤情報">不適切な内容・誤情報</option>
                  <option value="著作権侵害・無断転載">著作権侵害・無断転載</option>
                  <option value="誹謗中傷・公序良俗違反">誹謗中傷・公序良俗違反</option>
                  <option value="その他">その他</option>
                </select>
              </div>
              <textarea
                rows={2}
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder="詳細（任意）..."
                className="w-full p-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setReportingTarget(null)}
                  className="px-3 py-1.5 rounded-xl text-xs text-slate-500 font-bold"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSendReport}
                  className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
                >
                  通報を送信
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

