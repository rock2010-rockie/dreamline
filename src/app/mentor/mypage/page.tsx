'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { auth, db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import styles from './mentorMypage.module.css'

interface MentorInfo {
  name?: string
  job?: string
  major?: string
  middle?: string
  minor?: string
  age?: number | string
  career?: string
}

const removeNumberPrefix = (text?: string) =>
  (text ?? '').replace(/^\d+\.\s*/, '')

const toNum = (v: any) => (typeof v === 'number' ? v : Number(v))

export default function MentorMypagePage() {
  const [mentor, setMentor] = useState<MentorInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) return
      const ref = doc(db, 'users', user.uid)
      const snap = await getDoc(ref)
      const data = (snap.data() || {}) as MentorInfo
      setMentor({
        name: data.name ?? '',
        job: data.job ?? '',
        major: data.major ?? '',
        middle: data.middle ?? '',
        minor: data.minor ?? '',
        age: data.age ?? '',
        career: data.career ?? '',
      })
      setLoading(false)
    })
    return () => unsub()
  }, [])

  if (loading || !mentor) return <div className={styles.loading}>불러오는 중...</div>

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.profileIcon}>👤</div>

        <div className={styles.name}>{mentor.name || '이름 미설정'}</div>

        <div className={styles.info}>
          직업/전문분야 — {mentor.job || '미설정'} /
          {` ${removeNumberPrefix(mentor.major) || '미설정'} / `}
          {removeNumberPrefix(mentor.middle) || '미설정'} /
          {removeNumberPrefix(mentor.minor) || '미설정'}
        </div>

        <div className={styles.age}>
          나이 — {mentor.age ? toNum(mentor.age) : '미설정'}
        </div>

        <div className={styles.career}>
          경력/특이사항 — {mentor.career || '미설정'}
        </div>

        <Link href="/mentor/mypage/edit" className={styles.editButton}>
          수정하기
        </Link>
      </div>
    </div>
  )
}
