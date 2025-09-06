'use client'

import { useEffect, useState } from 'react'
import { useParams,useRouter } from 'next/navigation'
import { doc, getDoc, addDoc, collection } from 'firebase/firestore'
import { db, auth } from '@/lib/firebase'
import styles from './studentDetail.module.css'
import Image from 'next/image'   // ✅ 추가

type StudentType = {
  id: string
  name: string
  age: number
  major: string
  middle?: string
  minor?: string
}

// ✅ 앞 숫자와 점만 제거하는 함수
const removeNumberPrefix = (str?: string) => {
  return str?.replace(/^\d+\./, '') || ''
}

export default function StudentDetail() {
  const param = useParams() as { id: string }
  const id = param.id
  const router = useRouter()
  const [student, setStudent] = useState<StudentType | null>(null)

  useEffect(() => {
    const fetchStudent = async () => {
      const docRef = doc(db, 'users', id as string)
      const snapshot = await getDoc(docRef)
      if (snapshot.exists()) {
        setStudent({ id: snapshot.id, ...snapshot.data() } as StudentType)
      }
    }

    fetchStudent()
  }, [id])

  const handleRequest = async () => {
    const currentUser = auth.currentUser
    if (!currentUser || !student) return

    await addDoc(collection(db, 'requests'), {
      from: currentUser.uid,
      to: student.id,
      status: 'pending',
      timestamp: new Date()
    })

    alert('채팅 요청을 보냈습니다!')
  }

  if (!student) return <div>Loading...</div>

  return (
    <div className={styles.container}>
      {/* ✅ 뒤로가기 버튼 */}
      <button className={styles.back} onClick={() => router.back()} aria-label="뒤로가기">
          &lt;
        </button>

      <div className={styles.card}>
        <div className={styles.icon}>👤</div>
        <h2 className={styles.name}>{student.name}</h2>
        <p className={styles.category}>
          관심 분야: {removeNumberPrefix(student.major)} / {removeNumberPrefix(student.middle)} / {removeNumberPrefix(student.minor)}
        </p>
        <p className={styles.age}>나이 - {student.age}</p>
      </div>

      <button className={styles.button} onClick={handleRequest}>
        채팅 요청 보내기
      </button>
    </div>
  )
}
