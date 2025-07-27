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
  setDoc
} from 'firebase/firestore'
import styles from './requestPage.module.css'
import { useRouter } from 'next/navigation'

type RequestType = {
  id: string
  from: string
  status: string
  timestamp: any
}

type UserInfo = {
  name: string
  note?: string
}

export default function RequestPage() {
  const [requests, setRequests] = useState<{ request: RequestType; user: UserInfo }[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

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

      const fetchedRequests: { request: RequestType; user: UserInfo }[] = []

      for (const docSnap of snapshot.docs) {
        const requestData = docSnap.data() as RequestType
        const userDoc = await getDoc(doc(db, 'users', requestData.from))
        if (userDoc.exists()) {
          const userData = userDoc.data() as UserInfo
          fetchedRequests.push({
            request: {
              ...requestData,
              id: docSnap.id
            },
            user: {
              name: userData.name,
              note: userData.note || '경력/특이사항'
            }
          })
        }
      }

      setRequests(fetchedRequests)
      setLoading(false)
    }

    fetchRequests()
  }, [])

  const handleAccept = async (requestId: string) => {
    const currentUser = auth.currentUser
    if (!currentUser) return

    // 요청 문서 가져오기
    const requestRef = doc(db, 'requests', requestId)
    const requestSnap = await getDoc(requestRef)
    if (!requestSnap.exists()) return

    const requestData = requestSnap.data() as RequestType
    const fromId = requestData.from
    const toId = currentUser.uid

    // 요청 상태 업데이트
    await updateDoc(requestRef, { status: 'accepted' })

    // 채팅방 ID 만들기 (두 UID를 정렬해서 고정된 ID로)
    const chatId = [fromId, toId].sort().join('_')
    const chatRef = doc(db, 'chats', chatId)

    // chats 문서 생성 또는 업데이트
    await updateDoc(chatRef, {
      participants: [fromId, toId],
      createdAt: new Date()
    }).catch(async () => {
      await setDoc(chatRef, {
        participants: [fromId, toId],
        createdAt: new Date()
      })
    })

    // 요청 목록에서 제거
    setRequests((prev) => prev.filter((item) => item.request.id !== requestId))
    alert('채팅이 수락되었습니다!')
  }

  const handleReject = async (requestId: string) => {
    await updateDoc(doc(db, 'requests', requestId), {
      status: 'rejected'
    })
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
              <button
                className={styles.accept}
                onClick={() => handleAccept(request.id)}
              >
                수락
              </button>
              <button
                className={styles.reject}
                onClick={() => handleReject(request.id)}
              >
                거절
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
