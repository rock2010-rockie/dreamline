'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { auth, db } from '@/lib/firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import styles from './editPage.module.css'
import { categoryData } from '@/data/categoryData'

// categoryData가 객체(딕셔너리)라고 가정
type CategoryDict = {
    [major: string]: { [middle: string]: string[] }
}
const dict = categoryData as unknown as CategoryDict

const removeNumberPrefix = (text?: string) =>
    (text ?? '').replace(/^\d+\.\s*/, '')

export default function MentorMypageEditPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // 폼 상태
    const [name, setName] = useState('')
    const [job, setJob] = useState('')       // 직업/직무
    const [age, setAge] = useState<number | ''>('')

    const [major, setMajor] = useState('')
    const [middle, setMiddle] = useState('')
    const [minor, setMinor] = useState('')

    const [career, setCareer] = useState('') // 경력/특이사항

    // ✅ 분류 세 개 모두 선택되었는지
    const isCategoryValid = !!major && !!middle && !!minor

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

            const parsedAge =
                typeof data.age === 'number' ? data.age :
                    typeof data.age === 'string' && data.age.trim() !== '' ? Number(data.age) : ''

            setName(data.name ?? '')
            setJob(data.job ?? '')
            setAge(Number.isFinite(parsedAge as number) ? (parsedAge as number) : '')

            setMajor(data.major ?? '')
            setMiddle(data.middle ?? '')
            setMinor(data.minor ?? '')

            setCareer(data.career ?? '')

            // 멘토 역할 보장
            if (data.role !== 'mentor') {
                await setDoc(ref, { role: 'mentor' }, { merge: true })
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

        // ✅ 분류 필수 검증
        if (!isCategoryValid) {
            alert('전문 분야(대·중·소분류)를 모두 선택해 주세요.')
            return
        }

        const user = auth.currentUser
        if (!user) return
        setSaving(true)

        try {
            const payload: Record<string, any> = {
                name: name.trim() || undefined,
                job: job.trim() || undefined,
                age: age === '' ? undefined : Number(age),
                // ✅ 필수 값 보장
                major,
                middle,
                minor,
                career: career.trim() || undefined,
                role: 'mentor', // 고정
            }

            await setDoc(doc(db, 'users', user.uid), payload, { merge: true })

            alert('저장했어요!')
            router.push('/mentor/mypage')
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
                <button className={styles.back} onClick={() => router.push('/mentor/mypage')}>〈</button>
                <div className={styles.title}>내 정보 수정 (멘토)</div>
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
                        직업/직무
                        <input
                            className={styles.input}
                            value={job}
                            onChange={(e) => setJob(e.target.value)}
                            placeholder="예: 영상 PD, 진로상담사"
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
                            placeholder="예: 29"
                        />
                    </label>
                </div>

                <div className={styles.section}>
                    {/* ✅ 라벨만 텍스트 변경 */}
                    <div className={styles.sectionTitle}>전문 분야 (필수)</div>

                    <div className={styles.grid3}>
                        <div>
                            <div className={styles.smallLabel}>대분류</div>
                            <select
                                className={styles.select}
                                value={major}
                                onChange={(e) => onChangeMajor(e.target.value)}
                                required
                            >
                                <option value="">선택해 주세요</option>
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
                                required
                            >
                                <option value="">{major ? '선택해 주세요' : '대분류 먼저 선택'}</option>
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
                                required
                            >
                                <option value="">{middle ? '선택해 주세요' : '중분류 먼저 선택'}</option>
                                {minorOptions.map((mi) => (
                                    <option key={mi} value={mi}>
                                        {removeNumberPrefix(mi)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className={styles.section}>
                    <div className={styles.sectionTitle}>경력/특이사항 (선택)</div>
                    <textarea
                        className={styles.textarea}
                        rows={5}
                        value={career}
                        onChange={(e) => setCareer(e.target.value)}
                        placeholder="예: 방송국 5년 경력, 청소년 멘토링 2년, 포트폴리오 링크 등"
                    />
                </div>

                {/* ✅ 3개 전부 선택되어야만 저장 가능 */}
                <button className={styles.saveBtn} disabled={saving || !isCategoryValid}>
                    {saving ? '저장 중...' : '저장하기'}
                </button>
            </form>
        </div>
    )
}
