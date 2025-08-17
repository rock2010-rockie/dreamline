'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import styles from './taskDetail.module.css'; 

interface Assignment {
  title: string;
  content: string;
  steps: string[];
  progress: number;
  isCompleted: boolean;
  createdBy: string;
  createdAt?: any;
}

export default function TaskDetailPage() {
  const router = useRouter();
  const params = useParams();

  const raw = (params as any)?.chatId as string | string[] | undefined;
  const chatId = Array.isArray(raw) ? raw[0] : raw;

  const [data, setData] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!chatId || typeof chatId !== 'string' || chatId.trim() === '') {
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const ref = doc(db, 'chats', chatId, 'assignment', 'current');
        const snap = await getDoc(ref);

        if (snap.exists() && !cancelled) {
          const raw = snap.data() ?? {};
          setData({
            title: String(raw.title ?? ''),
            content: String(raw.content ?? ''),
            steps: Array.isArray(raw.steps) ? raw.steps : [],
            progress: Number(raw.progress ?? 0),
            isCompleted: Boolean(raw.isCompleted ?? false),
            createdBy: String(raw.createdBy ?? ''),
            createdAt: raw.createdAt,
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [chatId]);

  if (loading) return <div className={styles.container}>로딩중…</div>;

  if (!data) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <button className={styles.back} onClick={() => router.back()}>←</button>
          <div className={styles.title}>과제</div>
          <div style={{ width: 48 }} />
        </div>
        <div style={{ padding: 16 }}>과제를 찾을 수 없어요.</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.back} onClick={() => router.back()}>←</button>
        <div className={styles.title}>과제</div>
        <div style={{ width: 48 }} />
      </div>

      <div className={styles.form}>
        <label className={styles.label}>과제 제목</label>
        <div className={styles.input} style={{ pointerEvents: 'none' }}>
          {data.title}
        </div>

        <label className={styles.label}>과제 내용</label>
        <div className={styles.textarea} style={{ whiteSpace: 'pre-wrap', pointerEvents: 'none' }}>
          {data.content}
        </div>

        {data.steps?.length > 0 && (
          <>
            <div className={styles.divider} />
            <label className={styles.label}>과제 길잡이</label>
            {data.steps.map((s, i) => (
              <div key={i} className={styles.stepRow}>
                <div className={styles.stepIndex}>{i + 1}.</div>
                <div className={styles.stepInput} style={{ pointerEvents: 'none' }}>
                  {s}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
