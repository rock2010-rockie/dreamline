'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  doc,
  getDoc,
  onSnapshot,
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
} from 'firebase/firestore'
import { db, auth } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import styles from './mentorDetail.module.css'

interface MentorData {
  name: string
  major: string
  middle: string
  minor: string
  age: number
  career: string
  ratingSum?: number
  ratingCount?: number
  ratingAvg?: number
  trustLevel?: '낮음' | '중간' | '높음'
  trustScore?: number
}

export default function MentorDetailPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()   // ✅ params 대신 useParams로 id만 사용

  const [mentor, setMentor] = useState<MentorData | null>(null)
  const [hasChat, setHasChat] = useState<boolean>(false)

  useEffect(() => {
    if (!id) return

    const ref = doc(db, 'users', id)

    // ✅ 실시간 구독으로 mentor 세팅 + 에러 콜백 + cleanup
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) setMentor(snap.data() as MentorData)
        else setMentor(null)
      },
      (err) => {
        console.error('[mentor detail] onSnapshot error:', err)
      }
    )

    // ✅ 이미 채팅이 있는지 확인
    ;(async () => {
      const me = auth.currentUser
      if (!me) return
      const qs = await getDocs(
        query(collection(db, 'chats'), where('participants', 'array-contains', me.uid))
      )
      const exists = qs.docs.some(d => {
        const pts = (d.data() as any)?.participants as string[] | undefined
        return Array.isArray(pts) && pts.includes(id)
      })
      setHasChat(exists)
    })()

    return () => unsub()
  }, [id])

  const cleanCategory = (text: string) => text.replace(/^\d+\./, '')

  const getUserNow = async () => {
    if (auth.currentUser) return auth.currentUser
    return await new Promise<any>((resolve) => {
      const unsub = onAuthStateChanged(auth, (u) => {
        unsub()
        resolve(u)
      })
    })
  }

  const handleOpenRatingPage = async () => {
    try {
      const me = await getUserNow()
      if (!me) {
        alert('로그인이 필요합니다.')
        return
      }

      const myRatingRef = doc(db, 'users', id, 'ratings', me.uid)
      const mySnap = await getDoc(myRatingRef)

      if (mySnap.exists()) {
        const last = (mySnap.data() as any)?.lastRatedAt
        if (last?.toDate) {
          const lastDt: Date = last.toDate()
          const nextAllowed = new Date(lastDt.getTime() + 7 * 24 * 60 * 60 * 1000)
          const now = new Date()
          if (now < nextAllowed) {
            const nextStr = nextAllowed.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
            alert(`별점은 1주일에 1번만 줄 수 있어요.\n다음 가능일: ${nextStr}`)
            return
          }
        }
      }

      router.push(`/rating/${id}`)
    } catch (err) {
      console.error(err)
      alert('상태 확인 중 오류가 발생했어요.')
    }
  }

  const handleRequestChat = async () => {
    const user = auth.currentUser
    if (!user) {
      alert('로그인이 필요합니다.')
      return
    }
    if (hasChat) {
      alert('이미 이 멘토와 채팅이 생성되어 있어요.')
      return
    }
    try {
      await addDoc(collection(db, 'requests'), {
        from: user.uid,
        to: id,
        status: 'pending',
        createdAt: serverTimestamp(),
      })
      alert('채팅 요청이 전송되었습니다!')
    } catch (e) {
      console.error(e)
      alert('요청 전송에 실패했어요.')
    }
  }

  if (!mentor) return <div className={styles.container}>로딩 중...</div>

  const sum = mentor.ratingSum ?? 0
  const cnt = mentor.ratingCount ?? 0
  const avg = cnt > 0 ? sum / cnt : 0
  const avg1 = Math.round(avg * 10) / 10
  const avgText = avg1.toFixed(1)
  const level = avg1 < 2 ? '낮음' : avg1 < 4 ? '중간' : '높음'

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.back} onClick={() => router.back()} aria-label="뒤로가기">
          &lt;
        </button>
      </div>

      <div className={styles.card}>
        <div className={styles.profileImage}></div>
        <div className={styles.name}>{mentor.name}</div>

        <div className={styles.info}>
          직업 / 전문분야 - {cleanCategory(mentor.major)} / {cleanCategory(mentor.middle)} / {cleanCategory(mentor.minor)}
        </div>
        <div className={styles.age}>나이 - {mentor.age}</div>
        <div className={styles.description}>
          <strong>경력 / 특이사항 </strong>
          {mentor.career || '-'}
        </div>
      </div>

      {!hasChat && (
        <button className={styles.chatButton} onClick={handleRequestChat}>
          채팅 요청 보내기
        </button>
      )}

      <div
        className={styles.trustRow}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        style={{ position: 'relative', zIndex: 5 }}
      >
        <span className={styles.trustText}>
          멘토신뢰도: {avgText} <small>/ 5 ({level})</small>
        </span>
        <button
          className={styles.ghostBtn}
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleOpenRatingPage() }}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          style={{ position: 'relative', zIndex: 6, pointerEvents: 'auto', cursor: 'pointer' }}
        >
          멘토 별점 주기
        </button>
      </div>
    </div>
  )
}
