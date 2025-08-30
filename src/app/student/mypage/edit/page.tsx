'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { auth, db } from '@/lib/firebase'
import { doc, getDoc, setDoc, deleteField } from 'firebase/firestore' // ← deleteField 추가
import styles from './editPage.module.css'
import { categoryData } from '@/data/categoryData'

// categoryData가 객체(딕셔너리)일 때의 타입
type CategoryDict = {
  [major: string]: { [middle: string]: string[] }  // 소분류 배열
}
const dict = categoryData as unknown as CategoryDict

const removeNumberPrefix = (text?: string) =>
  (text ?? '').replace(/^\d+\.\s*/, '')

export default function StudentMypageEditPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // 폼 상태
  const [name, setName] = useState('')
  const [age, setAge] = useState<number | ''>('')

  const [major, setMajor] = useState('')
  const [middle, setMiddle] = useState('')
  const [minor, setMinor] = useState('')

  // 옵션 계산
  const majorOptions = useMemo(() => Object.keys(dict ?? {}), [])
  const middleOptions = useMemo<string[]>(() => {
    if (!major) return []
    return Object.keys(dict[major] ?? {})
  }, [major])
  const minorOptions = useMemo<string[]>(() => {
    if (!major || !middle) return []
    return dict[major]?.[middle] ?? []
  }, [major, middle])

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) { router.push('/login'); return }

      const ref = doc(db, 'users', user.uid)
      const snap = await getDoc(ref)
      const data = snap.data() || {}

      // age 안전 변환(문자열 "16"도 허용)
      const parsedAge =
        typeof data.age === 'number' ? data.age :
        typeof data.age === 'string' && data.age.trim() !== '' ? Number(data.age) : ''

      setName(data.name ?? '')
      setAge(Number.isFinite(parsedAge as number) ? (parsedAge as number) : '')

      setMajor(data.major ?? '')
      setMiddle(data.middle ?? '')
      setMinor(data.minor ?? '')

      // role이 비어 있으면 student로 고정
      if (!data.role) {
        await setDoc(ref, { role: 'student' }, { merge: true })
      }

      setLoading(false)
    })
    return () => unsub()
  }, [router])

  const onChangeMajor = (v: string) => {
    setMajor(v)
    setMiddle('')
    setMinor('')
  }
  const onChangeMiddle = (v: string) => {
    setMiddle(v)
    setMinor('')
  }

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const user = auth.currentUser
    if (!user) return

    setSaving(true)
    try {
      // 기본(이름/나이/역할) 페이로드 — 기존 로직 유지
      const basePayload: Record<string, any> = {
        name: name.trim() || undefined,
        age: age === '' ? undefined : Number(age),
        role: 'student',
      }

      // 🔥 분류 저장 규칙
      // - 대분류 미선택(''): major/middle/minor 모두 제거
      // - 대분류만 선택: major 저장, middle/minor 제거
      // - 대+중 선택: major/middle 저장, minor 제거
      // - 대+중+소 선택: 모두 저장
      const categoryUpdates: Record<string, any> = {}

      if (!major) {
        // 아무 분류도 원치 않음 → 모두 삭제
        categoryUpdates.major = deleteField()
        categoryUpdates.middle = deleteField()
        categoryUpdates.minor = deleteField()
      } else {
        // 대분류는 선택됨
        categoryUpdates.major = major

        if (!middle) {
          // 중분류 미선택 → 중/소 삭제
          categoryUpdates.middle = deleteField()
          categoryUpdates.minor = deleteField()
        } else {
          // 중분류 선택됨
          categoryUpdates.middle = middle

          if (!minor) {
            // 소분류 미선택 → 소만 삭제
            categoryUpdates.minor = deleteField()
          } else {
            // 소분류까지 선택됨
            categoryUpdates.minor = minor
          }
        }
      }

      await setDoc(
        doc(db, 'users', user.uid),
        { ...basePayload, ...categoryUpdates },
        { merge: true }
      )

      alert('저장했어요!')
      router.push('/student/mypage')
      router.refresh()
    } catch (err) {
      console.error(err)
      alert('저장 중 오류가 발생했어요.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className={styles.container}>불러오는 중...</div>

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.back} onClick={() => router.push('/student/mypage')}>〈</button>
        <div className={styles.title}>내 정보 수정</div>
        <div style={{ width: 24 }} />
      </div>

      <form className={styles.form} onSubmit={onSave}>
        <div className={styles.section}>
          <div className={styles.sectionTitle}>기본 정보</div>

          <label className={styles.label}>
            이름
            <input
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름"
            />
          </label>

          <label className={styles.label}>
            나이
            <input
              className={styles.input}
              type="number"
              min={1}
              value={age}
              onChange={(e) => {
                const v = e.target.value
                setAge(v === '' ? '' : Number(v))
              }}
              placeholder="예: 16"
            />
          </label>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>관심 분야 (선택)</div>

          <div className={styles.grid3}>
            <div>
              <div className={styles.smallLabel}>대분류</div>
              <select
                className={styles.select}
                value={major}
                onChange={(e) => onChangeMajor(e.target.value)}
              >
                <option value="">선택 안 함</option>
                {majorOptions.map((mj) => (
                  <option key={mj} value={mj}>
                    {removeNumberPrefix(mj)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className={styles.smallLabel}>중분류</div>
              <select
                className={styles.select}
                value={middle}
                onChange={(e) => onChangeMiddle(e.target.value)}
                disabled={!major}
              >
                <option value="">{major ? '선택 안 함' : '대분류 먼저'}</option>
                {middleOptions.map((mm) => (
                  <option key={mm} value={mm}>
                    {removeNumberPrefix(mm)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className={styles.smallLabel}>소분류</div>
              <select
                className={styles.select}
                value={minor}
                onChange={(e) => setMinor(e.target.value)}
                disabled={!middle}
              >
                <option value="">{middle ? '선택 안 함' : '중분류 먼저'}</option>
                {minorOptions.map((mi) => (
                  <option key={mi} value={mi}>
                    {removeNumberPrefix(mi)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <button className={styles.saveBtn} disabled={saving}>
          {saving ? '저장 중...' : '저장하기'}
        </button>
      </form>
    </div>
  )
}
