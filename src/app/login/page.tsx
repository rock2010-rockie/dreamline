'use client'

import styles from './login.module.css'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { getDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase' // Firestore 객체 추가

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('') 
  const [error, setError] = useState('')

  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const uid = userCredential.user.uid

      // Firestore에서 유저 정보 가져오기
      const userDoc = await getDoc(doc(db, 'users', uid))
      const role = userDoc.data()?.role

      if (role === 'student') {
        router.push('/student')
      } else if (role === 'mentor') {
        router.push('/mentor')
      } else {
        setError('회원 역할 정보가 없습니다.')
      }
    } catch (err) {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.')
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>DREAMLINE</div>
      <div className={styles.formBox}>
        <h1 className={styles.title}>DREAMLINE</h1>
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
        <button className={styles.loginButton} onClick={handleLogin}>
          Log In
        </button>
        {error && <p className={styles.errorText}>{error}</p>}
        <p className={styles.signupText} onClick={() => router.push('/signup')}>
          회원가입
        </p>
      </div>
    </div>
  )
}