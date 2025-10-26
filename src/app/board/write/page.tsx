'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { categoryData } from '@/data/categoryData'
import styles from './write.module.css'
import Image from 'next/image'

export default function WritePage() {
  const router = useRouter()

  const [role, setRole] = useState<'mentor' | 'student' | null>(null)
  const [major, setMajor] = useState('')
  const [middle, setMiddle] = useState('')
  const [minor, setMinor] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  const majorList = Object.keys(categoryData)
  const middleList = major ? Object.keys(categoryData[major] || {}) : []
  const minorList = major && middle ? categoryData[major][middle] || [] : []

  // 역할 불러오기
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) return
      const docRef = doc(db, 'users', user.uid)
      const snapshot = await getDoc(docRef)
      const data = snapshot.data()
      if (data?.role === 'mentor') setRole('mentor')
      else setRole('student')
    })
    return () => unsubscribe()
  }, [])

  const handleSubmit = async () => {
    if (!role || !title || !content || !major || !middle || !minor) {
      alert('모든 항목을 입력해주세요.')
      return
    }

    const category = role === 'mentor' ? '멘토소식' : '궁금해요'

    try {
      const user = auth.currentUser
      if (!user) return alert('로그인이 필요합니다.')

      const userDoc = await getDoc(doc(db, 'users', user.uid))
      const userData = userDoc.data()

      await addDoc(collection(db, 'posts'), {
        category,
        major,
        middle,
        minor,
        title,
        content,
        uid: user.uid,
        authorName: userData?.name || '익명',
        authorRole: userData?.role || '학생',
        createdAt: serverTimestamp(),
      })

      router.push('/board')
    } catch (error) {
      console.error('업로드 오류:', error)
      alert('게시 실패')
    }
  }

  return (
    <div className={styles.container}>
      {/* 상단바 */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.back()}>
          <Image src="/back.svg" alt="뒤로가기" />
        </button>
        <button className={styles.submitBtn} onClick={handleSubmit}>
          게시하기
        </button>
      </div>

      {/* 게시글 유형 */}
      {role && (
        <div className={styles.fixedCategory}>
          게시글 유형 · {role === 'mentor' ? '멘토소식' : '궁금해요'}
        </div>
      )}

      {/* ✅ 분류 3가지 한 줄 배치 */}
      <div
        className={styles.categoryRow}
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '8px',
          marginTop: '12px',
          marginBottom: '12px',
        }}
      >
        <select
          className={styles.select}
          value={major}
          onChange={(e) => {
            setMajor(e.target.value)
            setMiddle('')
            setMinor('')
          }}
          aria-label="대분류 선택"
        >
          <option value="">대분류 선택</option>
          {majorList.map((m) => (
            <option key={m} value={m}>
              {m.replace(/^\d+\./, '')}
            </option>
          ))}
        </select>

        <select
          className={styles.select}
          value={middle}
          onChange={(e) => {
            setMiddle(e.target.value)
            setMinor('')
          }}
          aria-label="중분류 선택"
          disabled={!major}
        >
          <option value="">중분류 선택</option>
          {middleList.map((m) => (
            <option key={m} value={m}>
              {m.replace(/^\d+\./, '')}
            </option>
          ))}
        </select>

        <select
          className={styles.select}
          value={minor}
          onChange={(e) => setMinor(e.target.value)}
          aria-label="소분류 선택"
          disabled={!middle}
        >
          <option value="">소분류 선택</option>
          {minorList.map((m) => (
            <option key={m} value={m}>
              {m.replace(/^\d+\./, '')}
            </option>
          ))}
        </select>
      </div>

      {/* 제목 + 구분선 + 내용 (선 1개로만 구분) */}
      <div className={styles.fields}>
        <input
          className={styles.titleInput}
          placeholder="제목을 입력해주세요."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {/* ✅ 선 하나 */}
        <hr className={styles.singleDivider} />

        <textarea
          className={styles.contentInput}
          placeholder="여기를 눌러 새로운 소식을 남겨보세요."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>

     
    </div>
  )
}
