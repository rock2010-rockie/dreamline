'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'
import Link from 'next/link'
import styles from './result.module.css'

interface Mentor {
  id: string
  name: string
  field: string
  major: string
  middle: string
  minor: string
  trust: string
}

export default function MentorResultPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const major = searchParams.get('major') || ''
  const middle = searchParams.get('middle') || ''
  const minor = searchParams.get('minor') || ''
  const trust = searchParams.get('trust') || ''

  const [mentors, setMentors] = useState<Mentor[]>([])
  const [noResult, setNoResult] = useState(false)

  const fetchMentors = async () => {
    try {
      const conditions = [
        where('role', '==', 'mentor'),
        where('major', '==', major),
      ]
      if (middle) conditions.push(where('middle', '==', middle))
      if (minor) conditions.push(where('minor', '==', minor))
      if (trust) conditions.push(where('trust', '==', trust))

      const q = query(collection(db, 'users'), ...conditions)
      const snapshot = await getDocs(q)

      if (snapshot.empty) {
        setNoResult(true)
        setMentors([])
      } else {
        const result = snapshot.docs.map((doc) => ({
          ...(doc.data() as Mentor),
          id: doc.id,
        }))
        setMentors(result)
        setNoResult(false)
      }
    } catch (err) {
      console.error('검색 실패:', err)
      setNoResult(true)
    }
  }

  useEffect(() => {
    fetchMentors()
  }, [])

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => router.back()}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              d="M15 18l-6-6 6-6"
              stroke="#000"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <span className={styles.title}>멘토 둘러보기</span>
      </div>

      {noResult ? (
        <p className={styles.noResult}>아직 멘토가 없어요..</p>
      ) : (
        <div className={styles.cardList}>
          {mentors.map((mentor) => (
            <Link
              href={`/student/mentor/${mentor.id}`}
              key={mentor.id}
              className={styles.card}
            >
              <div className={styles.icon}>👤</div>
              <div className={styles.info}>
                <div className={styles.name}>{mentor.name}</div>
                <div className={styles.desc}>
                  {mentor.field || `${mentor.middle} / ${mentor.minor}`}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
