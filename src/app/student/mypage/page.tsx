'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { auth, db } from '@/lib/firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import styles from './studentMypage.module.css'

interface StudentInfo {
  name: string
  major: string
  middle: string
  minor: string
  age: number
}

const removeNumberPrefix = (text: string) => {
  return text?.replace(/^\d+\.\s*/, '') ?? ''
}

export default function StudentMypagePage() {
  const [student, setStudent] = useState<StudentInfo | null>(null)
  const router = useRouter()

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

  // 로그아웃 함수 (확인 창 추가)
  const handleLogout = async () => {
    const confirmLogout = window.confirm('로그아웃 하시겠습니까?')
    if (!confirmLogout) return

    try {
      await signOut(auth)
      router.push('/login') // 로그인 화면으로 이동
    } catch (error) {
      console.error('로그아웃 실패:', error)
    }
  }

  if (!student) return <div className={styles.loading}>불러오는 중...</div>

  return (
    <div className={styles.wrapper}>
      {/* 로그아웃 버튼 */}
      <button onClick={handleLogout} className={styles.logoutButton}>
        로그아웃
      </button>

      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.profileIcon}>👤</div>
          <div className={styles.name}>{student.name || '이름 미설정'}</div>
          <div className={styles.info}>
            관심 분야 - {removeNumberPrefix(student.major) || '미설정'} /{' '}
            {removeNumberPrefix(student.middle) || '미설정'} /{' '}
            {removeNumberPrefix(student.minor) || '미설정'}
          </div>
          <div className={styles.age}>
            나이 - {student.age ? student.age : '미설정'}
          </div>

          {/* 수정하기 버튼 */}
          <Link href="/student/mypage/edit" className={styles.editButton}>
            수정하기
          </Link>
        </div>
      </div>
    </div>
  )
}
