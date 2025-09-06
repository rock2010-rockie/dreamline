// src/app/student/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { auth, db } from '@/lib/firebase'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  limit as fsLimit,
} from 'firebase/firestore'
import styles from './student.module.css'

// Firestore 사용자 문서 타입(필요 필드만 정의)
type UserDoc = {
  major?: string
  name?: string
  role?: string
  career?: string
  special?: string
  bio?: string
}

interface Mentor {
  id: string
  name: string
  major?: string
  bio?: string // 경력/특이사항
}

export default function StudentHomePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [mentors, setMentors] = useState<Mentor[]>([])

  useEffect(() => {
    const run = async () => {
      try {
        const user = auth.currentUser
        if (!user) {
          router.push('/login')
          return
        }

        // 내 프로필에서 대분류(major) 읽기
        const meRef = doc(db, 'users', user.uid)
        const meSnap = await getDoc(meRef)
        const meData = (meSnap.data() as UserDoc | undefined) ?? undefined
        const myMajor: string | undefined = meData?.major

        // 해당 대분류 멘토 추천 (멘토가 mentors 컬렉션이면 그 이름으로 변경)
        const base = collection(db, 'users')
        const q = myMajor
          ? query(base, where('role', '==', 'mentor'), where('major', '==', myMajor), fsLimit(20))
          : query(base, where('role', '==', 'mentor'), fsLimit(20)) // major 없을 땐 상위 N

        const snap = await getDocs(q)
        const rows: Mentor[] = snap.docs.map(d => {
          const data = d.data() as UserDoc
          return {
            id: d.id,
            name: data.name ?? '이름 없음',
            major: data.major,
            bio: data.career ?? data.special ?? data.bio ?? '',
          }
        })
        setMentors(rows)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [router])

  const goFind = () => router.push('/student/search') // ← 기존 검색 화면으로 이동

  return (
    <div className={styles.pageWrap}>
      <div className={styles.headerRow}>
        <div className={styles.title}>추천멘토</div>
        <button className={styles.findBtn} onClick={goFind}>멘토 찾으러 가기</button>
      </div>

      {loading ? (
        <div className={styles.skeletonList}>
          <div className={styles.cardSkeleton} />
          <div className={styles.cardSkeleton} />
          <div className={styles.cardSkeleton} />
        </div>
      ) : mentors.length === 0 ? (
        <div className={styles.emptyWrap}>
          <p className={styles.emptyText}>아직 멘토가 없어요. 다른 멘토를 찾아보세요!</p>
        </div>
      ) : (
        <ul className={styles.cardList}>
          {mentors.map(m => (
            <li
              key={m.id}
              className={styles.card}
              onClick={() => router.push(`/student/mentor/${m.id}`)}
            >
              <div className={styles.avatar} aria-hidden>👤</div>
              <div className={styles.meta}>
                <div className={styles.name}>{m.name}</div>
                <div className={styles.desc}>{m.bio || '경력/ 특이사항'}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
