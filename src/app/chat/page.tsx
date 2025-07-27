'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { auth, db } from '@/lib/firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'
import styles from './chatList.module.css'

interface ChatItem {
  id: string           // chatId
  otherUserName: string
  otherUserRole: '멘토' | '학생'
}

export default function ChatListPage() {
  const [chatList, setChatList] = useState<ChatItem[]>([])
  const [userRole, setUserRole] = useState<'멘토' | '학생'>()
  const router = useRouter()

  useEffect(() => {
    const fetchChats = async () => {
      const user = auth.currentUser
      if (!user) return

      // 유저 역할 불러오기
      const userDoc = await getDocs(
        query(collection(db, 'users'), where('uid', '==', user.uid))
      )
      const userData = userDoc.docs[0]?.data()
      const role = userData?.role || '학생'
      setUserRole(role)

      // 채팅 목록 가져오기
      const q = query(
        collection(db, 'chats'),
        where('participants', 'array-contains', user.uid)
      )
      const chatDocs = await getDocs(q)

      const results: ChatItem[] = []

      for (const docSnap of chatDocs.docs) {
        const chat = docSnap.data()
        const otherId = chat.participants.find((id: string) => id !== user.uid)

        // 상대방 이름 가져오기
        const otherUserSnap = await getDocs(
          query(collection(db, 'users'), where('uid', '==', otherId))
        )
        const otherUser = otherUserSnap.docs[0]?.data()

        results.push({
          id: docSnap.id, // ✅ chatId
          otherUserName: otherUser?.name || '알 수 없음',
          otherUserRole: otherUser?.role || '학생',
        })
      }

      setChatList(results)
    }

    fetchChats()
  }, [])

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        {userRole === '멘토' ? '학생과 채팅하기' : '멘토와 채팅하기'}
      </h1>

      <ul className={styles.list}>
        {chatList.map(chat => (
          <li
            key={chat.id}
            className={styles.card}
            onClick={() => router.push(`/chat/${chat.id}`)} // ✅ 이동 기능 추가
            style={{ cursor: 'pointer' }} // UX 개선
          >
            <div className={styles.avatar}>👤</div>
            <div>
              <div className={styles.name}>{chat.otherUserName}</div>
              <div className={styles.sub}>새 채팅을 시작해 보세요!</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
