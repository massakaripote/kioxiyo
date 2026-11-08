import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  type Auth,
  type User,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  type Firestore,
} from 'firebase/firestore';
import type { SharedProblemSet, CurrentAffairPost, ReportItem } from '@/types/share';
import { db as localDb } from '@/db';

// Firebase設定（環境変数から安全に取得）
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let firestore: Firestore | null = null;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    firestore = getFirestore(app);
  } catch (err) {
    console.warn('Firebase initialization skipped:', err);
  }
}

/**
 * 匿名認証を実行してユーザーUIDを取得する
 */
export async function getOrSignInUser(): Promise<User | null> {
  if (!auth) return null;

  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth!, async (user) => {
      unsubscribe();
      if (user) {
        resolve(user);
      } else {
        try {
          const cred = await signInAnonymously(auth!);
          resolve(cred.user);
        } catch (err) {
          console.error('Anonymous sign in error:', err);
          resolve(null);
        }
      }
    });
  });
}

/**
 * 一般公開問題集の一覧を取得（ページネーション 20件制限で通信量・費用を節約）
 */
export async function fetchPublicProblemSets(subject?: string): Promise<SharedProblemSet[]> {
  if (!firestore) return [];

  const ref = collection(firestore, 'publicProblemSets');
  let q = query(ref, orderBy('createdAt', 'desc'), limit(20));

  if (subject && subject !== 'すべて') {
    q = query(ref, where('subject', '==', subject), orderBy('createdAt', 'desc'), limit(20));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
}

/**
 * URL限定公開の問題集をIDで取得（1件のみ取得で読み取り課金最小化）
 */
export async function fetchUnlistedProblemSet(id: string): Promise<SharedProblemSet | null> {
  if (!firestore) return null;

  const docRef = doc(firestore, 'unlistedProblemSets', id);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as any) };
}

/**
 * 問題集を投稿（一般公開 or URL限定公開）
 */
export async function publishProblemSet(
  data: Omit<SharedProblemSet, 'id' | 'authorUid' | 'createdAt' | 'updatedAt'>,
  user: User
): Promise<string> {
  if (!firestore) throw new Error('Firebaseが設定されていません');

  const collectionName = data.isPublic ? 'publicProblemSets' : 'unlistedProblemSets';
  const targetCol = collection(firestore, collectionName);

  const newDoc = {
    ...data,
    authorUid: user.uid,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const docRef = await addDoc(targetCol, newDoc);
  return docRef.id;
}

/**
 * 共有問題集を自分の端末（IndexedDB）にコピーする
 * ※ コピー後は元のFirebaseデータから完全に独立して学習可能
 */
export async function copyProblemSetToLocal(sharedSet: SharedProblemSet): Promise<number> {
  let copiedCount = 0;

  for (const q of sharedSet.questions) {
    const localId = `shared-${Date.now()}-${copiedCount}`;
    await localDb.questions.put({
      ...q,
      id: localId,
      subject: sharedSet.subject,
      unit: `${sharedSet.title} (${sharedSet.unit})`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await localDb.masteryStats.put({
      questionId: localId,
      points: 0,
      status: 'unseen',
      timesAsked: 0,
      correctCount: 0,
      incorrectCount: 0,
      isWeak: false,
    });

    copiedCount++;
  }

  // 単元も追加
  await localDb.units.add({
    id: `unit-${Date.now()}`,
    subject: sharedSet.subject,
    name: `${sharedSet.title} (${sharedSet.unit})`,
    orderIndex: 99,
  });

  return copiedCount;
}

/**
 * 地理の時事問題一覧を取得（最新順 / 古い順）
 */
export async function fetchCurrentAffairs(order: 'desc' | 'asc' = 'desc'): Promise<CurrentAffairPost[]> {
  if (!firestore) return [];

  const ref = collection(firestore, 'currentAffairs');
  const q = query(ref, orderBy('createdAt', order), limit(25));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
}

/**
 * 地理の時事問題を投稿
 */
export async function publishCurrentAffair(
  data: Omit<CurrentAffairPost, 'id' | 'authorUid' | 'createdAt' | 'updatedAt'>,
  user: User
): Promise<string> {
  if (!firestore) throw new Error('Firebaseが設定されていません');

  const ref = collection(firestore, 'currentAffairs');
  const docRef = await addDoc(ref, {
    ...data,
    authorUid: user.uid,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  return docRef.id;
}

/**
 * 地理の時事問題を削除（投稿者本人または管理人のみ許可）
 */
export async function deleteCurrentAffair(postId: string): Promise<void> {
  if (!firestore) throw new Error('Firebaseが設定されていません');
  const docRef = doc(firestore, 'currentAffairs', postId);
  await deleteDoc(docRef);
}

/**
 * 共有問題集を削除（投稿者本人または管理人のみ許可）
 */
export async function deleteProblemSet(setId: string, isPublic: boolean): Promise<void> {
  if (!firestore) throw new Error('Firebaseが設定されていません');
  const collectionName = isPublic ? 'publicProblemSets' : 'unlistedProblemSets';
  const docRef = doc(firestore, collectionName, setId);
  await deleteDoc(docRef);
}

/**
 * 不適切投稿の通報を送信
 */
export async function submitReport(
  params: {
    targetType: 'problemSet' | 'currentAffair';
    targetId: string;
    reason: string;
    details?: string;
  },
  user: User
): Promise<void> {
  if (!firestore) throw new Error('Firebaseが設定されていません');

  const ref = collection(firestore, 'reports');
  await addDoc(ref, {
    ...params,
    reporterUid: user.uid,
    createdAt: Date.now(),
    status: 'pending',
  });
}

