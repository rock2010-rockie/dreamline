'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { auth, db, storage } from '@/lib/firebase'
import {
  collection,
  doc,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  getDoc,
  updateDoc,
  arrayUnion,
} from 'firebase/firestore'
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage'
import styles from './chatPage.module.css'

interface Message {
  id: string
  sender: string
  text?: string
  imageUrl?: string
  timestamp: any
  readBy?: string[]
}

export default function ChatRoomPage() {
  const { chatId } = useParams()
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [otherName, setOtherName] = useState('')
  const [otherUserId, setOtherUserId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const currentUser = auth.currentUser

  // ✅ 상대방 정보 가져오기
  useEffect(() => {
    const fetchOtherUser = async () => {
      if (!chatId || !currentUser) return

      const chatDoc = await getDoc(doc(db, 'chats', chatId as string))
      const chatData = chatDoc.data()
      if (!chatData) return

      // ✅ participants 배열에서 내 UID가 아닌 값 찾기
      const participants = chatData.participants as string[]
      if (!participants || participants.length !== 2) return

      const otherId = participants.find((uid) => uid !== currentUser.uid)
      if (!otherId) return

      setOtherUserId(otherId)

      const otherUserDoc = await getDoc(doc(db, 'users', otherId))
      const otherUserData = otherUserDoc.data()
      setOtherName(otherUserData?.name || '상대방')
    }

    fetchOtherUser()
  }, [chatId, currentUser])

  // 🔄 메시지 실시간 로딩 + 읽음 업데이트
  useEffect(() => {
    if (!chatId || !currentUser) return

    const q = query(collection(db, 'chats', chatId as string, 'messages'), orderBy('timestamp'))

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const msgs: Message[] = []

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data() as Omit<Message, 'id'>
        const msg = {
          id: docSnap.id,
          ...data,
          readBy: data.readBy || [],
        }
        msgs.push(msg)

        const isNotMine = msg.sender !== currentUser.uid
        const notYetRead = !msg.readBy.includes(currentUser.uid)

        if (isNotMine && notYetRead) {
          await updateDoc(docSnap.ref, {
            readBy: arrayUnion(currentUser.uid),
          })
        }
      }

      setMessages(msgs)
    })

    return () => unsubscribe()
  }, [chatId, currentUser])

  // ⬇️ 자동 스크롤
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || !chatId || !currentUser) return

    await addDoc(collection(db, 'chats', chatId as string, 'messages'), {
      sender: currentUser.uid,
      text: input.trim(),
      timestamp: new Date(),
      readBy: [currentUser.uid],
    })

    setInput('')
  }

  const handlePlusClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !chatId || !currentUser) return

    const storageRef = ref(storage, `chatImages/${chatId}/${Date.now()}_${file.name}`)
    await uploadBytes(storageRef, file)
    const url = await getDownloadURL(storageRef)

    await addDoc(collection(db, 'chats', chatId as string, 'messages'), {
      sender: currentUser.uid,
      imageUrl: url,
      timestamp: new Date(),
      readBy: [currentUser.uid],
    })
  }

  const formatTime = (timestamp: any) => {
    if (!timestamp?.toDate) return ''
    const date = timestamp.toDate()
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp?.toDate) return ''
    const date = timestamp.toDate()
    return `<${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}>`
  }

  const isDifferentDay = (current: any, previous: any) => {
    const cur = current.toDate?.()
    const prev = previous?.toDate?.()
    return (
      !prev ||
      cur.getFullYear() !== prev.getFullYear() ||
      cur.getMonth() !== prev.getMonth() ||
      cur.getDate() !== prev.getDate()
    )
  }

  // ✅ 로딩 중 처리
  if (!currentUser || !otherUserId) return <div>로딩 중...</div>

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.back} onClick={() => router.back()}>←</button>
        <div className={styles.name}>{otherName}</div>
      </div>

      <div className={styles.chatArea}>
        {messages.length === 0 ? (
          <p className={styles.empty}>새로운 채팅을 시작해보세요</p>
        ) : (
          messages.map((msg, index) => {
            const isMyMessage = msg.sender === currentUser.uid
            const isRead = isMyMessage && msg.readBy?.includes(otherUserId)

            const isLastMyMessage = (() => {
              for (let i = messages.length - 1; i >= 0; i--) {
                if (messages[i].sender === currentUser.uid) {
                  return messages[i].id === msg.id
                }
              }
              return false
            })()

            const showDateSeparator =
              index === 0 ||
              isDifferentDay(msg.timestamp, messages[index - 1]?.timestamp)

            return (
              <div key={msg.id}>
                {showDateSeparator && (
                  <div className={styles.dateSeparator}>
                    {formatDate(msg.timestamp)}
                  </div>
                )}

                <div className={isMyMessage ? styles.myMessageWrapper : styles.otherMessageWrapper}>
                  <div className={isMyMessage ? styles.myMessage : styles.otherMessage}>
                    {msg.text && <span>{msg.text}</span>}
                    {msg.imageUrl && (
                      <img src={msg.imageUrl} alt="전송한 이미지" className={styles.image} />
                    )}
                  </div>
                  <div className={isMyMessage ? styles.myTimestamp : styles.otherTimestamp}>
                    {formatTime(msg.timestamp)}
                    {isLastMyMessage && isRead && (
                      <span className={styles.read}>읽음</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef}></div>
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
