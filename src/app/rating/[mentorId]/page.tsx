'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { db, auth } from '@/lib/firebase'
import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import styles from './rating.module.css'

function levelFromAvg(avg: number) {
  if (avg < 2) return '낮음'
  if (avg < 4) return '중간'
  return '높음'
}

function formatKST(dt: Date) {
  return dt.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
}

export default function MentorRatingPage() {
  const { mentorId } = useParams() as { mentorId: string }
  const router = useRouter()
  const [mentorName, setMentorName] = useState<string>('')
  const [selected, setSelected] = useState<number>(0)
  const [submitting, setSubmitting] = useState(false)

  // ✅ auth 초기화 지연 대비: 로그인 사용자 확보
  const getUserNow = async () => {
    if (auth.currentUser) return auth.currentUser
    return await new Promise<any>((resolve) => {
      const unsub = onAuthStateChanged(auth, (u) => {
        unsub()
        resolve(u)
      })
    })
  }

  useEffect(() => {
    const run = async () => {
      // 멘토 이름 로드(그대로)
      const ref = doc(db, 'users', mentorId)
      const snap = await getDoc(ref)
      if (snap.exists()) setMentorName((snap.data() as any)?.name ?? '')

      // ✅ 진입 가드: 최근 평가 7일 이내면 알림 후 뒤로가기
      const me = await getUserNow()
      if (!me) return
      const myRatingRef = doc(db, 'users', mentorId, 'ratings', me.uid)
      const mySnap = await getDoc(myRatingRef)
      if (mySnap.exists()) {
        const last = (mySnap.data() as any)?.lastRatedAt
        if (last?.toDate) {
          const lastDt: Date = last.toDate()
          const nextAllowed = new Date(lastDt.getTime() + 7 * 24 * 60 * 60 * 1000)
          if (new Date() < nextAllowed) {
            alert(`별점은 1주일에 1번만 줄 수 있어요.\n다음 가능일: ${formatKST(nextAllowed)}`)
            router.back()
            return
          }
        }
      }
    }
    run()
  }, [mentorId])

  const handleRate = async () => {
    if (!selected) return
    setSubmitting(true)
    try {
      const me = await getUserNow()
      if (!me) {
        alert('로그인이 필요합니다.')
        setSubmitting(false)
        return
      }

      // ✅ 저장 직전 재검사(우회 방지)
      const myRatingRef = doc(db, 'users', mentorId, 'ratings', me.uid)
      const mySnap = await getDoc(myRatingRef)
      if (mySnap.exists()) {
        const last = (mySnap.data() as any)?.lastRatedAt
        if (last?.toDate) {
          const lastDt: Date = last.toDate()
          const nextAllowed = new Date(lastDt.getTime() + 7 * 24 * 60 * 60 * 1000)
          if (new Date() < nextAllowed) {
            alert(`별점은 1주일에 1번만 줄 수 있어요.\n다음 가능일: ${formatKST(nextAllowed)}`)
            setSubmitting(false)
            return
          }
        }
      }

      const ref = doc(db, 'users', mentorId)
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(ref)
        if (!snap.exists()) throw new Error('멘토 문서가 없습니다.')

        const data = snap.data() as any
        const sum = Number(data.ratingSum ?? 0) + selected
        const count = Number(data.ratingCount ?? 0) + 1
        const avg = count > 0 ? sum / count : 0

        const trustLevel = levelFromAvg(avg)
        const ratingAvg = Math.round(avg * 10) / 10
        const trustScore = Math.round((avg / 5) * 100) // ← 너의 기존 로직 그대로 둠

        tx.update(ref, {
          ratingSum: sum,
          ratingCount: count,
          ratingAvg,       // 검색/필터용 캐시
          trustLevel,      // 낮음/중간/높음
          trustScore,      // (선택) 0~100 스케일
        })

        // ✅ 내 최근 평가 시각 기록 (쿨다운 근거)
        tx.set(
          myRatingRef,
          {
            lastValue: selected,
            lastRatedAt: serverTimestamp(),
          },
          { merge: true }
        )
      })

      alert('별점을 남겼습니다!')
      router.back()
    } catch (e: any) {
      alert('실패: ' + e.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.back} onClick={() => router.back()}>&lt;</button>
      </div>

      <div className={styles.rateWrap}>
        <div className={styles.name}>{mentorName}</div>

        <div className={styles.stars}>
          {[1,2,3,4,5].map(n => (
            <button
              key={n}
              className={n <= selected ? styles.starOn : styles.starOff}
              onClick={() => setSelected(n)}
              aria-label={`${n}점`}
            >
              ★
            </button>
          ))}
          <div className={styles.score}>{selected || 0}/5</div>
        </div>

        <div className={styles.caption}>(멘토의 신뢰도를 평가해주세요.)</div>

        <button
          className={styles.primary}
          disabled={!selected || submitting}
          onClick={handleRate}
        >
          {submitting ? '저장 중…' : '별점주기'}
        </button>
      </div>
    </div>
  )
}
