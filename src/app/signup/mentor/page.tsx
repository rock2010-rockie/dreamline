'use client'

import styles from './mentor.module.css'
import { useState } from 'react'
import { categoryData } from '@/data/categoryData';

import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export default function MentorSignupPage() {
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [major, setMajor] = useState('')
  const [middle, setMiddle] = useState('')
  const [minor, setMinor] = useState('')
  const [career, setCareer] = useState('')
  const router = useRouter()

  const majorList = Object.keys(categoryData)
  const middleList = major ? Object.keys(categoryData[major] || {}) : []
  const minorList = major && middle ? categoryData[major][middle] || [] : []

  const handleSubmit = async () => {
    if (!name || !email || !password || !age) {
      alert('모든 정보를 입력해주세요.');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name,
        age : Number(age),
        email,
        major,
        middle,
        minor,
        career,
        role: 'mentor',
        createdAt: new Date(),

        // ✅ 신뢰도 기본값 (50점, 보통) — 시스템 시드 1표
        trustScore: 50,
        trustLevel: '보통',
        ratingSum: 50,
        ratingCount: 1,
      });

      router.push('/login'); // ✅ 로그인 화면으로 이동
    } catch (error: any) {
      alert('회원가입 실패: ' + error.message);
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

      <div className={styles.sectionTitle}>직업/전문분야(필수)</div>

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
            {item}
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
        <option value="">중분류</option>
        {middleList.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>

      <select
        className={styles.input}
        value={minor}
        onChange={(e) => setMinor(e.target.value)}
        disabled={!middle}
      >
        <option value="">소분류</option>
        {minorList.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>

      <input
        className={styles.input}
        type="text"
        placeholder="경력/ 특이사항"
        value={career}
        onChange={(e) => setCareer(e.target.value)}
      />

      <button className={styles.submitButton} onClick={handleSubmit}>
        가입하기
      </button>
    </div>
  )
}
