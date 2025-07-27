'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import styles from './Navbar.module.css'

export default function Navbar() {
  const pathname = usePathname()
  const [homePath, setHomePath] = useState('/student') // 기본값
  const [mypagePath, setMypagePath] = useState('/student/mypage') // 기본값

  useEffect(() => {
    const fetchUserRole = async () => {
      const user = auth.currentUser
      if (!user) return

      const docRef = doc(db, 'users', user.uid)
      const snapshot = await getDoc(docRef)
      const data = snapshot.data()

      if (data?.role === 'mentor') {
        setHomePath('/mentor')
        setMypagePath('/mentor/mypage')
      }
    }

    fetchUserRole()
  }, [])

  return (
    <nav className={styles.navbar}>
      <Link href={homePath}>
        <img
          src="/home.svg"
          alt="홈"
          className={pathname === homePath ? styles.active : styles.icon}
        />
      </Link>
      <Link href="/chat">
        <img
          src="/chat.svg"
          alt="채팅"
          className={pathname === '/chat' ? styles.active : styles.icon}
        />
      </Link>
      <Link href="/board">
        <img
          src="/board.svg"
          alt="자유게시판"
          className={pathname === '/board' ? styles.active : styles.icon}
        />
      </Link>
      <Link href={mypagePath}>
        <img
          src="/user.svg"
          alt="마이페이지"
          className={pathname === mypagePath ? styles.active : styles.icon}
        />
      </Link>
    </nav>
  )
}
