'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import styles from './task.module.css';

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
  const chatIdRaw = params?.chatId as string | string[] | undefined;
  const chatId = Array.isArray(chatIdRaw) ? chatIdRaw[0] : chatIdRaw;

  const [data, setData] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>('');

  useEffect(() => {
    if (!chatId || typeof chatId !== 'string') {
      setErr('chatId가 비어있거나 문자열이 아님');
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const ref = doc(db, 'chats', chatId, 'assignment', 'current');
        const snap = await getDoc(ref);
        console.log('[detail] read', `chats/${chatId}/assignment/current`, 'exists=', snap.exists());

        if (!snap.exists()) {
          setErr('문서가 존재하지 않습니다.');
          setData(null);
          return;
        }

        const raw: any = snap.data() ?? {};
        // 필드가 전혀 없을 수도 있으니 기본값 넣기
        const title = raw.title ?? '';
        const content = raw.content ?? '';
        const steps = Array.isArray(raw.steps) ? raw.steps : [];
        const progress = Number(raw.progress ?? 0);

        if (!title && !content && steps.length === 0) {
          setErr('문서는 있으나 필드가 비어 있습니다.');
          setData(null);
          return;
        }

        setData({
          title,
          content,
          steps,
          progress,
          isCompleted: Boolean(raw.isCompleted ?? false),
          createdBy: raw.createdBy ?? '',
          createdAt: raw.createdAt,
        });
      } catch (e: any) {
        console.error(e);
        setErr(e?.message || '알 수 없는 오류');
      } finally {
        setLoading(false);
      }
    })();
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
        <div style={{ padding: 16 }}>
          <div>과제를 찾을 수 없어요.</div>
          <pre style={{ marginTop: 12, fontSize: 12, color: '#6B7280', whiteSpace: 'pre-wrap' }}>
            chatId: {String(chatId)}{'\n'}
            path: {`chats/${String(chatId)}/assignment/current`}{'\n'}
            hint: 해당 경로의 current 문서에 title/content/steps가 들어있는지 확인하세요.{'\n'}
            {err ? `error: ${err}` : ''}
          </pre>
        </div>
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
        <div className={styles.input} style={{ pointerEvents: 'none' }}>{data.title}</div>

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
                <div className={styles.stepInput} style={{ pointerEvents: 'none' }}>{s}</div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* 디버그용: 실제 읽고 있는 chatId / 경로 */}
      <div style={{ padding: 12, fontSize: 12, color: '#6B7280' }}>
        chatId: {String(chatId)} · path: {`chats/${String(chatId)}/assignment/current`}
      </div>
    </div>
  );
}
