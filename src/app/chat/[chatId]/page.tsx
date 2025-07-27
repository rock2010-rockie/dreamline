'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation' // ✅ useRouter 추가
import { auth, db, storage } from '@/lib/firebase'
import {
  collection,
  doc,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  getDoc
} from 'firebase/firestore'
import {
  ref,
  uploadBytes,
  getDownloadURL
} from 'firebase/storage'
import styles from './chatPage.module.css'

interface Message {
  id: string
  sender: string
  text?: string
  imageUrl?: string
  timestamp: any
}

export default function ChatRoomPage() {
  const { chatId } = useParams()
  const router = useRouter() // ✅ 추가
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [otherName, setOtherName] = useState('')
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const currentUser = auth.currentUser

  useEffect(() => {
    if (!chatId || !currentUser) return

    const q = query(
      collection(db, 'chats', chatId as string, 'messages'),
      orderBy('timestamp')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: Message[] = snapshot.docs.map(doc => {
        const data = doc.data() as Omit<Message, 'id'>
        return {
          id: doc.id,
          ...data
        }
      })

      setMessages(msgs)
    })

    return () => unsubscribe()
  }, [chatId, currentUser])

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  useEffect(() => {
    const fetchOtherUserName = async () => {
      if (!chatId || !currentUser) return

      const chatDoc = await getDoc(doc(db, 'chats', chatId as string))
      const data = chatDoc.data()
      if (!data) return

      const { user1, user2 } = data
      const otherUserId = user1 === currentUser.uid ? user2 : user1

      const otherUserDoc = await getDoc(doc(db, 'users', otherUserId))
      const otherUserData = otherUserDoc.data()
      if (otherUserData?.name) {
        setOtherName(otherUserData.name)
      }
    }

    fetchOtherUserName()
  }, [chatId, currentUser])

  const sendMessage = async () => {
    if (!input.trim() || !chatId || !currentUser) return

    await addDoc(collection(db, 'chats', chatId as string, 'messages'), {
      sender: currentUser.uid,
      text: input.trim(),
      timestamp: new Date()
    })

    setInput('')
  }

  const handlePlusClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !chatId || !currentUser) return

    try {
      const storageRef = ref(storage, `chatImages/${chatId}/${Date.now()}_${file.name}`)
      await uploadBytes(storageRef, file)
      const url = await getDownloadURL(storageRef)

      await addDoc(collection(db, 'chats', chatId as string, 'messages'), {
        sender: currentUser.uid,
        imageUrl: url,
        timestamp: new Date()
      })
    } catch (err) {
      console.error('이미지 업로드 실패:', err)
    }
  }

  return (
    <div className={styles.container}>
      {/* ✅ 헤더 추가 */}
      <div className={styles.header}>
        <button className={styles.back} onClick={() => router.back()}>←</button>
        <div className={styles.name}>{otherName}</div>
      </div>

      <div className={styles.chatArea}>
        {messages.length === 0 ? (
          <p className={styles.empty}>새로운 채팅을 시작해보세요</p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={
                msg.sender === currentUser?.uid ? styles.myMessage : styles.otherMessage
              }
            >
              {msg.text && <span>{msg.text}</span>}
              {msg.imageUrl && (
                <img
                  src={msg.imageUrl}
                  alt="전송한 이미지"
                  className={styles.image}
                />
              )}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className={styles.inputArea}>
        <button className={styles.plus} onClick={handlePlusClick}>＋</button>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <input
          className={styles.input}
          placeholder="메시지 입력"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button className={styles.send} onClick={sendMessage}>전송</button>
      </div>
    </div>
  )
}
