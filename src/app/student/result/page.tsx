'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'
import Link from 'next/link'
import styles from './result.module.css'

type TrustLevel = '' | '낮음' | '중간' | '높음'

interface Mentor {
  id: string
  name: string
  field?: string
  major?: string
  middle?: string
  minor?: string
  trust?: string
  ratingAvg?: number
  ratingSum?: number
  ratingCount?: number
  role?: string
}

// Firestore에서 읽어오는 원본 사용자 문서 타입(필요 필드만)
type UserDoc = {
  name?: string
  field?: string
  major?: string
  middle?: string
  minor?: string
  ratingAvg?: number
  ratingSum?: number
  ratingCount?: number
  role?: string
}

export default function MentorResultPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const major = searchParams.get('major') || ''
  const middle = searchParams.get('middle') || ''
  const minor = searchParams.get('minor') || ''
  const trust = (
    (searchParams.get('trustLevel') || searchParams.get('trust') || '').trim()
  ) as TrustLevel

  const [mentors, setMentors] = useState<Mentor[]>([])
  const [noResult, setNoResult] = useState(false)

  const fetchMentors = async (): Promise<void> => {
    try {
      // 1) 인덱스 없이 안전한 최소 쿼리: role == mentor
      const qLite = query(collection(db, 'users'), where('role', '==', 'mentor'))
      const snap = await getDocs(qLite)

      const all: Mentor[] = snap.docs.map((d) => {
        const data = d.data() as UserDoc
        return {
          id: d.id,
          name: data.name ?? '이름 없음',
          field: data.field,
          major: data.major,
          middle: data.middle,
          minor: data.minor,
          ratingAvg: data.ratingAvg,
          ratingSum: data.ratingSum,
          ratingCount: data.ratingCount,
          role: data.role,
        }
      })

      // 2) 클라이언트 필터 (major/middle/minor/ratingAvg)
      let min = 0
      let max = 5
      if (trust === '낮음') { min = 0; max = 2 }
      else if (trust === '중간') { min = 2; max = 4 }
      else if (trust === '높음') { min = 4; max = 5 }

      const filtered = all.filter((m) => {
        if (m.major !== major) return false
        if (middle && m.middle !== middle) return false
        if (minor && m.minor !== minor) return false

        if (trust) {
          const avg =
            typeof m.ratingAvg === 'number'
              ? m.ratingAvg
              : (m.ratingCount ? (Number(m.ratingSum || 0) / Number(m.ratingCount || 0)) : 0)
          return avg >= min && avg <= max
        }
        return true
      })

      setMentors(filtered)
      setNoResult(filtered.length === 0)
    } catch (err) {
      console.error('검색 실패:', err)
      setNoResult(true)
      setMentors([])
    }
  }

  useEffect(() => {
    fetchMentors()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => router.back()}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
            <path d="M15 18l-6-6 6-6" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className={styles.title}>멘토 둘러보기</span>
      </div>

      {noResult ? (
        <p className={styles.noResult}>아직 멘토가 없어요..</p>
      ) : (
        <div className={styles.cardList}>
          {mentors.map((mentor) => (
            <Link href={`/student/mentor/${mentor.id}`} key={mentor.id} className={styles.card}>
              <div className={styles.icon}>👤</div>
              <div className={styles.info}>
                <div className={styles.name}>{mentor.name}</div>
                <div className={styles.desc}>
                  {mentor.field || `${mentor.middle ?? ''} / ${mentor.minor ?? ''}`}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
