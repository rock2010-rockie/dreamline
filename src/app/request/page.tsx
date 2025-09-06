'use client'

import { useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  updateDoc,
  setDoc,
  Timestamp,
} from 'firebase/firestore'
import styles from './requestPage.module.css'

type RequestDoc = {
  from?: string
  status?: string
  timestamp?: Timestamp
}

type RequestType = {
  id: string
  from: string
  status: string
  timestamp?: Timestamp
}

type UserInfo = {
  name: string
  note?: string
}

export default function RequestPage() {
  const [requests, setRequests] = useState<{ request: RequestType; user: UserInfo }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRequests = async () => {
      const currentUser = auth.currentUser
      if (!currentUser) return

      const q = query(
        collection(db, 'requests'),
        where('to', '==', currentUser.uid),
        where('status', '==', 'pending')
      )
      const snapshot = await getDocs(q)

      const fetched: { request: RequestType; user: UserInfo }[] = []

      for (const docSnap of snapshot.docs) {
        const rd = (docSnap.data() as RequestDoc) || {}
        if (!rd.from || !rd.status) continue

        const userDoc = await getDoc(doc(db, 'users', rd.from))
        if (userDoc.exists()) {
          const userData = (userDoc.data() as UserInfo) || { name: '알 수 없음' }
          fetched.push({
            request: {
              id: docSnap.id,
              from: rd.from,
              status: rd.status,
              timestamp: rd.timestamp,
            },
            user: {
              name: userData.name,
              // note: userData.note || '경력/특이사항'
            },
          })
        }
      }

      setRequests(fetched)
      setLoading(false)
    }

    fetchRequests()
  }, [])

  const handleAccept = async (requestId: string) => {
    const currentUser = auth.currentUser
    if (!currentUser) return

    const requestRef = doc(db, 'requests', requestId)
    const requestSnap = await getDoc(requestRef)
    if (!requestSnap.exists()) return

    const requestData = (requestSnap.data() as RequestDoc) || {}
    const fromId = requestData.from
    const toId = currentUser.uid
    if (!fromId) return

    await updateDoc(requestRef, { status: 'accepted' })

    const chatId = [fromId, toId].sort().join('_')
    const chatRef = doc(db, 'chats', chatId)

    await updateDoc(chatRef, {
      participants: [fromId, toId],
      createdAt: new Date(),
    }).catch(async () => {
      await setDoc(chatRef, {
        participants: [fromId, toId],
        createdAt: new Date(),
      })
    })

    setRequests((prev) => prev.filter((item) => item.request.id !== requestId))
    alert('채팅이 수락되었습니다!')
  }

  const handleReject = async (requestId: string) => {
    await updateDoc(doc(db, 'requests', requestId), { status: 'rejected' })
    setRequests((prev) => prev.filter((item) => item.request.id !== requestId))
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>요청 확인하기</h2>

      {loading ? (
        <p>로딩 중...</p>
      ) : requests.length === 0 ? (
        <p className={styles.empty}>아직 요청이 없어요..</p>
      ) : (
        requests.map(({ request, user }) => (
          <div key={request.id} className={styles.card}>
            <div className={styles.profile}>👤</div>
            <div className={styles.info}>
              <p className={styles.name}>{user.name}</p>
              <p className={styles.note}>{user.note}</p>
            </div>
            <div className={styles.buttons}>
              <button className={styles.accept} onClick={() => handleAccept(request.id)}>
                수락
              </button>
              <button className={styles.reject} onClick={() => handleReject(request.id)}>
                거절
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
