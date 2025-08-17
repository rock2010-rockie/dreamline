'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './search.module.css'

const RECENT_KEY = 'recentSearches'  // localStorage key
const MAX_RECENT = 8

export default function BoardSearchPage() {
  const router = useRouter()
  const [keyword, setKeyword] = useState('')
  const [recents, setRecents] = useState<string[]>([])

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]')
    setRecents(Array.isArray(saved) ? saved : [])
  }, [])

  const saveRecent = (kw: string) => {
    const k = kw.trim()
    if (!k) return
    const next = [k, ...recents.filter(r => r !== k)].slice(0, MAX_RECENT)
    setRecents(next)
    localStorage.setItem(RECENT_KEY, JSON.stringify(next))
  }

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    const q = keyword.trim()
    if (!q) return
    saveRecent(q)
    router.push(`/board/search/result?keyword=${encodeURIComponent(q)}`)
  }

  const runFromRecent = (k: string) => {
    saveRecent(k)
    router.push(`/board/search/result?keyword=${encodeURIComponent(k)}`)
  }

  const removeRecent = (k: string) => {
    const next = recents.filter(r => r !== k)
    setRecents(next)
    localStorage.setItem(RECENT_KEY, JSON.stringify(next))
  }

  return (
    <div className={styles.container}>
      <button className={styles.back} onClick={() => router.back()}>&lt;</button>

      {/* 엔터/완료로 제출되게 form 사용 */}
      <form onSubmit={handleSubmit} className={styles.searchBar}>
        <input
          className={styles.input}
          type="search"
          placeholder="다양한 게시글을 검색하세요"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          enterKeyHint="search"
        />
      </form>

      <div className={styles.sectionTitle}>최근 검색어</div>
      <ul className={styles.recentList}>
        {recents.length === 0 && <li className={styles.empty}>최근 검색어가 없어요</li>}
        {recents.map(r => (
          <li key={r} className={styles.recentItem}>
            <button className={styles.recentText} onClick={() => runFromRecent(r)}>{r}</button>
            <button className={styles.removeBtn} onClick={() => removeRecent(r)}>x</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
