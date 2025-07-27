'use client'

import styles from './signup.module.css'
import { useRouter } from 'next/navigation'
import { ChevronRight } from 'lucide-react' // 화살표 아이콘 (lucide-react 설치 필요)


export default function SignupSelectPage() {
  const router = useRouter()

  return (
    <div className={styles.container}>
      <div className={styles.header}>DREAMLINE</div>

      <div className={styles.button} onClick={() => router.push('/signup/student')}>
        <span>학생으로 회원가입하기</span>
        <ChevronRight size={20} />
      </div>

      <div className={styles.button} onClick={() => router.push('/signup/mentor')}>
        <span>멘토로 회원가입하기</span>
        <ChevronRight size={20} />
      </div>
    </div>
  )
}