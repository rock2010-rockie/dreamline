'use client'

import { useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'
import styles from './mentorMypage.module.css'

interface MentorInfo {
  name: string
  job: string
  major: string
  middle: string
  minor: string
  age: number
  career: string
}

const removeNumberPrefix = (text: string) => {
  return text.replace(/^\d+\.\s*/, '')
}

export default function MentorMypagePage() {
  const [mentor, setMentor] = useState<MentorInfo | null>(null)

  useEffect(() => {
    const fetchMentorInfo = async () => {
      const user = auth.currentUser
      if (!user) return

      const q = query(collection(db, 'users'), where('uid', '==', user.uid))
      const snapshot = await getDocs(q)
      const data = snapshot.docs[0]?.data()

      if (data) {
        setMentor({
          name: data.name || '',
          job: data.job || '',
          major: data.major || '',
          middle: data.middle || '',
          minor: data.minor || '',
          age: data.age || 0,
          career: data.career || '',
        })
      }
    }

    fetchMentorInfo()
  }, [])

  if (!mentor) {
    return <div className={styles.loading}>불러오는 중...</div>
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.profileIcon}>👤</div>
        <div className={styles.name}>{mentor.name}</div>
        <div className={styles.info}>
         직업/전문분야 -  {mentor.job} / {removeNumberPrefix(mentor.major)} / {removeNumberPrefix(mentor.middle)} / {removeNumberPrefix(mentor.minor)}
        </div>
        <div className={styles.age}>나이 - {mentor.age}</div>
        <div className={styles.career}>
          경력/특이사항 - {mentor.career}
        </div>
      </div>
    </div>
  )
}
