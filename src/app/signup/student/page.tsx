'use client'

import styles from './student.module.css'
import { useState } from 'react'
import { categoryData } from '@/data/categoryData';



import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export default function StudentSignupPage() {
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [major, setMajor] = useState('')
  const [middle, setMiddle] = useState('')
  const [minor, setMinor] = useState('')
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
        age,
        email,
        major,
        middle,
        minor,
        role: 'student',
        createdAt: new Date(),
      });

      router.push('/login');
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

      <div className={styles.sectionTitle}>관심사/관심진로</div>

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

      <button className={styles.submitButton} onClick={handleSubmit}>
        가입하기
      </button>
    </div>
  )
}



