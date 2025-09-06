'use client'

import styles from './student.module.css'
import { useState } from 'react'
import { categoryData } from '@/data/categoryData'

import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc, serverTimestamp, type FieldValue } from 'firebase/firestore' // ✅ FieldValue 타입
import { auth, db } from '@/lib/firebase'
import { useRouter } from 'next/navigation'

// ✅ categoryData를 객체(딕셔너리)로 사용할 때의 타입
type CategoryDict = {
  [major: string]: { [middle: string]: string[] }
}
const dict = categoryData as unknown as CategoryDict

const removeNumberPrefix = (text: string) => text.replace(/^\d+\.\s*/, '')

// ✅ Firestore 쓰기 payload 타입
type UserCreatePayload = {
  uid: string
  role: 'student'
  name: string
  email: string
  age?: number
  major?: string
  middle?: string
  minor?: string
  createdAt: FieldValue
  updatedAt: FieldValue
}

export default function StudentSignupPage() {
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [major, setMajor] = useState('')
  const [middle, setMiddle] = useState('')
  const [minor, setMinor] = useState('')
  const router = useRouter()

  const majorList = Object.keys(dict)
  const middleList = major ? Object.keys(dict[major] || {}) : []
  const minorList = major && middle ? dict[major][middle] || [] : []

  const handleSubmit = async (): Promise<void> => {
    // 이름/이메일/비밀번호/나이만 필수, 분류는 선택
    if (!name || !email || !password || !age) {
      alert('이름, 나이, 이메일, 비밀번호는 필수입니다.')
      return
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // 선택값은 있을 때만 저장하도록 payload 구성
      const payload: UserCreatePayload = {
        uid: user.uid,
        role: 'student',
        name,
        email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        ...(age.trim() !== '' && !Number.isNaN(Number(age)) ? { age: Number(age) } : {}),
        ...(major ? { major } : {}),
        ...(middle ? { middle } : {}),
        ...(minor ? { minor } : {}),
      }

      await setDoc(doc(db, 'users', user.uid), payload, { merge: true })

      router.push('/login')
    } catch (error: unknown) { // ✅ any 제거
      const msg = error instanceof Error ? error.message : String(error)
      alert('회원가입 실패: ' + msg)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>DREAMLINE</div>
      <div className={styles.sectionTitle}>사용자 정보</div>
      <div className={styles.row}>
        <input
          className={styles.inputHalf}
          type="text"
          placeholder="이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className={styles.inputHalf}
          type="number"
          placeholder="나이"
          value={age}
          onChange={(e) => setAge(e.target.value)}
        />
      </div>

      <input
        className={styles.input}
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className={styles.input}
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {/* 라벨 문구 변경 */}
      <div className={styles.sectionTitle}>관심사/관심진로 (선택)</div>

      <select
        className={styles.input}
        value={major}
        onChange={(e) => {
          setMajor(e.target.value)
          setMiddle('')
          setMinor('')
        }}
      >
        <option value="">대분류</option>
        {majorList.map((item) => (
          <option key={item} value={item}>
            {removeNumberPrefix(item)}
          </option>
        ))}
      </select>

      <select
        className={styles.input}
        value={middle}
        onChange={(e) => {
          setMiddle(e.target.value)
          setMinor('')
        }}
        disabled={!major}
      >
        <option value="">{major ? '중분류' : '대분류 먼저'}</option>
        {middleList.map((item) => (
          <option key={item} value={item}>
            {removeNumberPrefix(item)}
          </option>
        ))}
      </select>

      <select
        className={styles.input}
        value={minor}
        onChange={(e) => setMinor(e.target.value)}
        disabled={!middle}
      >
        <option value="">{middle ? '소분류' : '중분류 먼저'}</option>
        {minorList.map((item) => (
          <option key={item} value={item}>
            {removeNumberPrefix(item)}
          </option>
        ))}
      </select>

      <button className={styles.submitButton} onClick={handleSubmit}>
        가입하기
      </button>
    </div>
  )
}
