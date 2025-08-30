'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { auth, db } from '@/lib/firebase'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import styles from './task.module.css'

export default function TaskCreatePage() {
  const { chatId } = useParams()
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [steps, setSteps] = useState<string[]>([''])
  const [isMentor, setIsMentor] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const user = auth.currentUser
    if (!user) return
    getDoc(doc(db, 'users', user.uid)).then((s) => {
      const role = s.data()?.role
      setIsMentor(role === 'mentor' || role === '멘토')
    })
  }, [])

  const addStep = () => setSteps((prev) => [...prev, ''])
  const changeStep = (i: number, v: string) =>
    setSteps((prev) => prev.map((s, idx) => (idx === i ? v : s)))

  const submit = async () => {
    if (submitting) return
    setSubmitting(true)
    try {
      const user = auth.currentUser
      if (!user) {
        alert('로그인이 필요합니다.')
        return
      }
      if (!isMentor) {
        alert('멘토만 과제를 등록할 수 있어요.')
        return
      }
      if (!title.trim()) {
        alert('과제 제목을 입력해주세요.')
        return
      }

      // 현재 과제 존재 여부 확인
      const ref = doc(db, 'chats', String(chatId), 'assignment', 'current')
      const snap = await getDoc(ref)

      if (snap.exists() && snap.data()?.isCompleted !== true) {
        alert('이미 진행 중인 과제가 있어요. 기존 과제를 완료한 뒤 새로 등록할 수 있습니다.')
        return
      }

      // 새 과제 등록
      await setDoc(ref, {
        title: title.trim(),
        content: content.trim(),
        steps: steps.map((s) => s.trim()).filter(Boolean),
        progress: 0,
        isCompleted: false,
        createdAt: serverTimestamp(),
        createdBy: user.uid,
      })

      router.back()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.back} onClick={() => router.back()}>←</button>
        <div className={styles.title}>과제 주기</div>
        <button className={styles.submit} onClick={submit} disabled={submitting}>
          과제주기
        </button>
      </div>

      <div className={styles.form}>
        <label className={styles.label}>과제 제목</label>
        <input
          className={styles.input}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="과제 제목"
        />

        <label className={styles.label}>과제 내용</label>
        <textarea
          className={styles.textarea}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="과제 내용"
          rows={5}
        />

        <div className={styles.divider} />

        <label className={styles.label}>과제흐름잡이</label>
        {steps.map((s, i) => (
          <div key={i} className={styles.stepRow}>
            <div className={styles.stepIndex}>{i + 1}.</div>
            <input
              className={styles.stepInput}
              placeholder={`${i + 1}.`}
              value={s}
              onChange={(e) => changeStep(i, e.target.value)}
            />
          </div>
        ))}

        <button className={styles.addStep} onClick={addStep}>＋</button>
      </div>
    </div>
  )
}
