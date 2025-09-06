'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { db } from '@/lib/firebase'
import { collection, getDocs, orderBy, query, limit as fsLimit, Timestamp } from 'firebase/firestore'
import styles from '../search.module.css'
import { categoryData } from '@/data/categoryData'

type PostDoc = {
  title?: string
  type?: '궁금해요' | '멘토소식' | string
  major?: string
  middle?: string
  minor?: string
  createdAt?: Timestamp
}

interface Post {
  id: string
  title: string
  type?: '궁금해요' | '멘토소식' | string
  major?: string
  middle?: string
  minor?: string
  createdAt?: Timestamp
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

type CategoryArrayItem = { major: string }
type CategoryDict = Record<string, unknown>

function isCategoryArray(x: unknown): x is CategoryArrayItem[] {
  return Array.isArray(x) && x.every(i => typeof (i as CategoryArrayItem).major === 'string')
}

function isCategoryDict(x: unknown): x is CategoryDict {
  return !!x && typeof x === 'object' && !Array.isArray(x)
}

const getMajorList = () => {
  if (isCategoryArray(categoryData)) return categoryData.map(c => c.major)
  if (isCategoryDict(categoryData)) return Object.keys(categoryData)
  return [] as string[]
}

const POST_DETAIL = (id: string) => `/board/${id}`

// ---------- 훅을 사용하는 실제 화면 ----------
function BoardSearchResultInner() {
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
      const raw: Post[] = snap.docs.map(d => {
        const data = d.data() as PostDoc
        return {
          id: d.id,
          title: data.title ?? '',
          type: data.type,
          major: data.major,
          middle: data.middle,
          minor: data.minor,
          createdAt: data.createdAt,
        }
      })

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

// ---------- Suspense로 감싸는 래퍼(페이지 기본 내보내기) ----------
export default function BoardSearchResultPage() {
  return (
    <Suspense fallback={<div style={{ padding: 16 }}>검색 결과 불러오는 중…</div>}>
      <BoardSearchResultInner />
    </Suspense>
  )
}
