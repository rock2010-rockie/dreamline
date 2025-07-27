'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { doc, getDoc } from 'firebase/firestore'
import { db, auth } from '@/lib/firebase' // ✅ auth도 함께 import
import styles from './mentorDetail.module.css'
import { useRouter } from 'next/navigation'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore' // ✅ 요청 저장용 import 추가

interface MentorData {
    name: string
    major: string
    middle: string
    minor: string
    age: number
    career: string
}

export default function MentorDetailPage({ params }: { params: { id: string } }) {
    const router = useRouter()
    const [mentor, setMentor] = useState<MentorData | null>(null)

    useEffect(() => {
        const fetchMentor = async () => {
            const docRef = doc(db, 'users', params.id)
            const docSnap = await getDoc(docRef)
            if (docSnap.exists()) {
                setMentor(docSnap.data() as MentorData)
            } else {
                console.log('No such document!')
            }
        }
        fetchMentor()
    }, [params.id])

    const cleanCategory = (text: string) => {
        return text.replace(/^\d+\./, '')
    }

    // ✅ 요청 전송 기능만 여기에 추가함
    const handleRequestChat = async () => {
        const user = auth.currentUser
        if (!user) {
            alert('로그인이 필요합니다.')
            return
        }

        try {
            // 멘토 UID = params.id 로 그대로 사용
            const mentorUid = params.id

            await addDoc(collection(db, 'requests'), {
                from: user.uid,
                to: mentorUid,
                status: 'pending',
                createdAt: serverTimestamp(),
            })
            alert('채팅 요청이 전송되었습니다!')
        } catch (error) {
            console.error('요청 전송 실패:', error)
            alert('요청 전송에 실패했어요.')
        }
    }

    if (!mentor) return <div>로딩 중...</div>

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.profileImage}></div>
                <div className={styles.name}>{mentor.name}</div>
                <div className={styles.info}>
                    직업 / 전문분야 -{' '}
                    {cleanCategory(mentor.major)} / {cleanCategory(mentor.middle)} / {cleanCategory(mentor.minor)}
                </div>
                <div className={styles.age}>나이 - {mentor.age}</div>
                <div className={styles.description}>
                    <strong>경력 / 특이사항  </strong>
                    {mentor.career || '-'}
                </div>
            </div>

            <button className={styles.chatButton} onClick={handleRequestChat}>
                채팅 요청 보내기
            </button>
        </div>
    )
}
