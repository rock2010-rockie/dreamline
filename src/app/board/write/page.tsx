'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { addDoc, collection, doc, getDoc, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { auth, db, storage } from '@/lib/firebase'
import { categoryData } from '@/data/categoryData'
import styles from './write.module.css'

export default function WritePage() {
  const router = useRouter()

  const [category, setCategory] = useState('')
  const [major, setMajor] = useState('')
  const [middle, setMiddle] = useState('')
  const [minor, setMinor] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [image, setImage] = useState<File | null>(null)

  const majorList = Object.keys(categoryData)
  const middleList = major ? Object.keys(categoryData[major] || {}) : []
  const minorList = major && middle ? categoryData[major][middle] || [] : []

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setImage(e.target.files[0])
    }
  }

  const handleSubmit = async () => {
    if (!category || !title || !content || !major || !middle || !minor) {
      alert('모든 항목을 입력해주세요.')
      return
    }

    try {
      const user = auth.currentUser
      if (!user) return alert('로그인이 필요합니다.')

      let imageUrl = ''

      if (image) {
        const imageRef = ref(storage, `boardImages/${Date.now()}_${image.name}`)
        await uploadBytes(imageRef, image)
        imageUrl = await getDownloadURL(imageRef)
      }

      const userDoc = await getDoc(doc(db, 'users', user.uid))
      const userData = userDoc.data()

      await addDoc(collection(db, 'posts'), {
        category,
        major,
        middle,
        minor,
        title,
        content,
        imageUrl,
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
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.back()}>
          <img src="/back.svg" alt="뒤로가기" />
        </button>
        <button className={styles.submitBtn} onClick={handleSubmit}>
          게시하기
        </button>
      </div>

      <select
        className={styles.select}
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      >
        <option value="">게시글 유형</option>
        <option value="궁금해요">궁금해요</option>
        <option value="멘토소식">멘토소식</option>
      </select>

      {/* 분류 선택 */}
      <select
        className={styles.select}
        value={major}
        onChange={(e) => {
          setMajor(e.target.value)
          setMiddle('')
          setMinor('')
        }}
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
      >
        <option value="">소분류 선택</option>
        {minorList.map((m) => (
          <option key={m} value={m}>
            {m.replace(/^\d+\./, '')}
          </option>
        ))}
      </select>

      <input
        className={styles.titleInput}
        placeholder="제목을 입력해주세요."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <hr className={styles.divider} />

      <textarea
        className={styles.contentInput}
        placeholder="여기를 눌러 새로운 소식을 남겨보세요."
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      <div className={styles.imageUploadContainer}>
        <label htmlFor="imageUpload">
          <img src="/upload-image.svg" alt="이미지 업로드" />
        </label>
        <input
          type="file"
          id="imageUpload"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ display: 'none' }}
        />
      </div>
    </div>
  )
}
