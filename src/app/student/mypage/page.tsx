'use client'

import { useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'
import styles from './studentMypage.module.css'

interface StudentInfo {
  name: string
  major: string
  middle: string
  minor: string
  age: number
}

const removeNumberPrefix = (text: string) => {
  return text.replace(/^\d+\.\s*/, '')
}

export default function StudentMypagePage() {
  const [student, setStudent] = useState<StudentInfo | null>(null)

  useEffect(() => {
    const fetchStudentInfo = async () => {
      const user = auth.currentUser
      if (!user) return

      const q = query(collection(db, 'users'), where('uid', '==', user.uid))
      const snapshot = await getDocs(q)
      const data = snapshot.docs[0]?.data()

      if (data) {
        setStudent({
          name: data.name || '',
          major: data.major || '',
          middle: data.middle || '',
          minor: data.minor || '',
          age: data.age || 0,
        })
      }
    }

    fetchStudentInfo()
  }, [])

  if (!student) return <div className={styles.loading}>불러오는 중...</div>

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.profileIcon}>👤</div>
        <div className={styles.name}>{student.name}</div>
        <div className={styles.info}>
          직업 / 전문분야 - {removeNumberPrefix(student.major)} / {removeNumberPrefix(student.middle)} / {removeNumberPrefix(student.minor)}
        </div>
        <div className={styles.age}>나이 - {student.age}</div>
      </div>
    </div>
  )
}
