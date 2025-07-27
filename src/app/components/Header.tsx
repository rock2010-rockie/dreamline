'use client'

import styles from './Header.module.css'
import { useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  Unsubscribe
} from 'firebase/firestore'
import { useRouter } from 'next/navigation'

export default function Header() {
  const [hasNewRequest, setHasNewRequest] = useState(false)
  const router = useRouter()

  useEffect(() => {
    let unsubscribeRequest: Unsubscribe | null = null
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setHasNewRequest(false)
        if (unsubscribeRequest) unsubscribeRequest()
        return
      }

      const uid = user.uid

      // 요청 받은 사람인 경우만 빨간점 표시
      const q = query(
        collection(db, 'requests'),
        where('to', '==', uid),
        where('status', '==', 'pending')
      )

      unsubscribeRequest = onSnapshot(q, (snapshot) => {
        setHasNewRequest(!snapshot.empty)
      })
    })

    return () => {
      if (unsubscribeRequest) unsubscribeRequest()
      unsubscribeAuth()
    }
  }, [])

  const handleBellClick = () => {
    router.push('/request')
  }

  return (
    <header className={styles.header}>
      <span className={styles.title}>DREAMLINE</span>
      <div className={styles.bellWrapper} onClick={handleBellClick}>
        <img src="/bell.svg" alt="알림" className={styles.bell} />
        {hasNewRequest && <span className={styles.redDot}></span>}
      </div>
    </header>
  )
}
