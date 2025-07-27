'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SplashPage() {
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/login')
    }, 2000) // 2초 후 이동

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div style={{
      backgroundColor: '#7B61FF',
      width: '100vw',
      height: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <h1 style={{ color: 'white', fontSize: '2.5rem', fontWeight: 'bold' }}>
        DREAMLINE
      </h1>
    </div>
  )
}