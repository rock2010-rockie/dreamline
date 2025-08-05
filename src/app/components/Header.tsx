'use client'

import styles from './Header.module.css'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { auth, db } from '@/lib/firebase'
import {
  collection,
  query,
  where,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore'

export default function Header() {
  const [hasNewRequest, setHasNewRequest] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // 특정 경로에서는 Header 숨기기
  const hiddenRoutes = ['/', '/login', '/signup', '/splash']
  const shouldHide = hiddenRoutes.includes(pathname) || pathname.startsWith('/chat')

  useEffect(() => {
    if (shouldHide) return

    let unsubscribeRequest: Unsubscribe | null = null
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setHasNewRequest(false)
        if (unsubscribeRequest) unsubscribeRequest()
        return
      }

      const uid = user.uid
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
  }, [shouldHide])

  const handleBellClick = () => {
    router.push('/request')
  }

  if (shouldHide) return null

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
