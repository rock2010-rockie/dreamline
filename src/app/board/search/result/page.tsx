'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { db } from '@/lib/firebase'
import { collection, getDocs, orderBy, query, limit as fsLimit } from 'firebase/firestore'
import styles from '../search.module.css'
import { categoryData } from '@/data/categoryData'

interface Post {
  id: string
  title: string
  type?: '궁금해요' | '멘토소식' | string
  major?: string
  middle?: string
  minor?: string
  createdAt?: any
}

function normalize(s: string) {
  return s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function matchesKeyword(title: string, rawQuery: string) {
  const t = normalize(title)
  const qs = normalize(rawQuery).split(' ').filter(Boolean)
  if (qs.length === 0) return false
  return qs.some(q => t.includes(q))
}

// "01.소분류명" -> "소분류명"
function stripNumberPrefix(s?: string) {
  if (!s) return '소분류'
  return s.replace(/^\d+\.\s?/, '')
}

const getMajorList = () => {
  if (Array.isArray(categoryData)) return (categoryData as any[]).map((c: any) => c.major)
  return Object.keys(categoryData as Record<string, any>)
}

// ✅ 상세 경로 수정: /board/[id]
const POST_DETAIL = (id: string) => `/board/${id}`

export default function BoardSearchResultPage() {
  const router = useRouter()
  const params = useSearchParams()
  const keyword = params.get('keyword') || ''

  const [allHit, setAllHit] = useState<Post[]>([])
  const [majorFilter, setMajorFilter] = useState<string>('') // '' = 전체

  useEffect(() => {
    if (!keyword.trim()) return

    const fetchPosts = async () => {
      const q = query(
        collection(db, 'posts'),
        orderBy('createdAt', 'desc'),
        fsLimit(200)
      )
      const snap = await getDocs(q)
      const raw: Post[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }))

      const hit = raw.filter(p => p.title && matchesKeyword(p.title, keyword))
      setAllHit(hit)
    }
    fetchPosts()
  }, [keyword])

  const majors = useMemo(() => ['전체', ...getMajorList()], [])
  const display = useMemo(
    () => allHit.filter(p => !majorFilter || majorFilter === '전체' || p.major === majorFilter),
    [allHit, majorFilter]
  )

  return (
    <div className={styles.container}>
      <button className={styles.back} onClick={() => router.back()}>&lt;</button>

      <div className={styles.searchBar}>
        <input className={styles.input} value={keyword} readOnly />
      </div>

      <div className={styles.filterRow}>
        <label className={styles.filterLabel}>검색분류</label>
        <select
          className={styles.select}
          value={majorFilter || '전체'}
          onChange={(e) => setMajorFilter(e.target.value)}
        >
          {majors.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      {display.length === 0 ? (
        <div className={styles.emptyResult}>해당 게시물이 없어요</div>
      ) : (
        <ul className={styles.resultList}>
          {display.map(p => (
            <li key={p.id} className={styles.card}>
              <Link href={POST_DETAIL(p.id)} className={styles.cardLink} prefetch>
                <div className={styles.cardMeta}>
                  -게시글 · {stripNumberPrefix(p.minor)}
                </div>
                <div className={styles.cardTitle}>{p.title}</div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
