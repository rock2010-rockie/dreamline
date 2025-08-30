'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { onAuthStateChanged } from 'firebase/auth' // ✅ 추가
import styles from './mentorDetail.module.css'

interface MentorData {
  name: string
  major: string
  middle: string
  minor: string
  age: number
  career: string
  // ✅ 신뢰도/평점 관련(옵션)
  ratingSum?: number
  ratingCount?: number
  ratingAvg?: number
  trustLevel?: '낮음' | '중간' | '높음'
  trustScore?: number // 0~5 스케일
}

export default function MentorDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [mentor, setMentor] = useState<MentorData | null>(null)
  const [hasChat, setHasChat] = useState<boolean>(false) // ✅ 이미 채팅 존재 여부

  useEffect(() => {
    const run = async () => {
      // ✅ 멘토 정보 - 실시간 반영(onSnapshot)
      const docRef = doc(db, 'users', params.id)
      const unsub = onSnapshot(docRef, (snap) => {
        if (snap.exists()) setMentor(snap.data() as MentorData)
      })

      // ✅ 나와 이 멘토 사이 채팅 존재 여부 확인(1회 체크)
      const me = auth.currentUser
      if (me) {
        const myChats = await getDocs(
          query(collection(db, 'chats'), where('participants', 'array-contains', me.uid))
        )
        let exists = false
        myChats.forEach(s => {
          const pts: string[] = (s.data() as any)?.participants || []
          if (Array.isArray(pts) && pts.includes(params.id)) exists = true
        })
        setHasChat(exists)
      }

      return () => unsub()
    }
    run()
  }, [params.id])

  const cleanCategory = (text: string) => text.replace(/^\d+\./, '')

  // ✅ auth 지연 대비: 사용자 확보
  const getUserNow = async () => {
    if (auth.currentUser) return auth.currentUser
    return await new Promise<any>((resolve) => {
      const unsub = onAuthStateChanged(auth, (u) => {
        unsub()
        resolve(u)
      })
    })
  }

  // ✅ 별점 주기 페이지로 가기 전 7일 쿨다운 검사
  const handleOpenRatingPage = async () => {
    try {
      const me = await getUserNow()
      if (!me) {
        alert('로그인이 필요합니다.')
        return
      }

      const myRatingRef = doc(db, 'users', params.id, 'ratings', me.uid)
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
            return // ⛔ 이동 차단 (여기서 종료)
          }
        }
      }

      // ✅ 통과 시에만 이동
      router.push(`/rating/${params.id}`)
    } catch (err) {
      console.error(err)
      alert('상태 확인 중 오류가 발생했어요.')
    }
  }

  // ✅ 요청 전송 (중복 방지)
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
        to: params.id, // 멘토 uid
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

  // ✅ 평균/등급 계산 (소수 1자리)
  const sum = mentor.ratingSum ?? 0
  const cnt = mentor.ratingCount ?? 0
  const avg = cnt > 0 ? sum / cnt : 0
  const avg1 = Math.round(avg * 10) / 10
  const avgText = avg1.toFixed(1)
  const level = avg1 < 2 ? '낮음' : avg1 < 4 ? '중간' : '높음'

  return (
    <div className={styles.container}>
      {/* ✅ 상단 뒤로가기 */}
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

      {/* ✅ 채팅이 이미 있으면 버튼 숨김 */}
      {!hasChat && (
        <button className={styles.chatButton} onClick={handleRequestChat}>
          채팅 요청 보내기
        </button>
      )}

      {/* ✅ 신뢰도 표시 + 별점 주러가기 */}
      <div
        className={styles.trustRow}
        onClick={(e) => e.stopPropagation()}              // ⛔ 부모 클릭 전파 차단
        onMouseDown={(e) => e.stopPropagation()}         // ⛔ 일부 단말 우회 방지
        onTouchStart={(e) => e.stopPropagation()}        // ⛔ 모바일 탭 전파 차단
        style={{ position: 'relative', zIndex: 5 }}
      >
        <span className={styles.trustText}>
          멘토신뢰도: {avgText} <small>/ 5 ({level})</small>
        </span>
        <button
          className={styles.ghostBtn}
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleOpenRatingPage() }} // ✅ 먼저 검사, 불가 시 즉시 종료
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
