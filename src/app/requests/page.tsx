'use client'

import styles from './requestPage.module.css'
import { useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { collection, query, where, getDocs, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore'
import { useRouter } from 'next/navigation'

interface Request {
  id: string
  fromId: string
  fromName: string
  fromCareer: string
}

export default function RequestPage() {
  const [requests, setRequests] = useState<Request[]>([])
  const router = useRouter()

  useEffect(() => {
    const fetchRequests = async () => {
      const user = auth.currentUser
      if (!user) return

      const q = query(
        collection(db, 'requests'),
        where('toId', '==', user.uid),
        where('status', '==', 'pending')
      )
      const snapshot = await getDocs(q)
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Request[]
      setRequests(data)
    }

    fetchRequests()
  }, [])

  const handleAccept = async (req: Request) => {
    // 요청 상태 업데이트
    await updateDoc(doc(db, 'requests', req.id), { status: 'accepted' })

    // 채팅방 만들기 (간단히 두 uid를 이어붙인 ID 사용)
    const currentUser = auth.currentUser
    if (!currentUser) return

    const chatId = [currentUser.uid, req.fromId].sort().join('_')
    await setDoc(doc(db, 'chats', chatId), {
      participants: [currentUser.uid, req.fromId],
      createdAt: new Date()
    })

    router.push(`/chat/${chatId}`)
  }

  const handleReject = async (requestId: string) => {
    await deleteDoc(doc(db, 'requests', requestId))
    setRequests(prev => prev.filter(r => r.id !== requestId))
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>요청 확인하기</h1>
      {requests.length === 0 ? (
        <p className={styles.empty}>아직 요청이 없어요..</p>
      ) : (
        <ul className={styles.list}>
          {requests.map((r) => (
            <li className={styles.card} key={r.id}>
              <div className={styles.userInfo}>
                <div className={styles.avatar}>👤</div>
                <div>
                  <div className={styles.name}>{r.fromName}</div>
                  <div className={styles.career}>{r.fromCareer}</div>
                </div>
              </div>
              <div className={styles.buttons}>
                <button className={styles.accept} onClick={() => handleAccept(r)}>수락</button>
                <button className={styles.reject} onClick={() => handleReject(r.id)}>거절</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
