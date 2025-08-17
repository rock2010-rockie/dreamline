'use client'

import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, orderBy, doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import styles from './board.module.css'
import PostCard from '../components/PostCard'
import { useRouter } from 'next/navigation'

interface Post {
  id: string
  title: string
  category: string
  authorName: string
  authorRole: string
  major: string
  middle: string
  minor: string
  createdAt: any
  heartCount?: number
  commentCount?: number
  likes?: string[]
  comments?: { text: string; [key: string]: any }[]
}

export default function BoardPage() {
  const [activeTab, setActiveTab] = useState<'전체' | '궁금해요' | '멘토소식' | '내 관심사'>('전체')
  const [posts, setPosts] = useState<Post[]>([])
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'comment'>('latest')
  const [showSortMenu, setShowSortMenu] = useState(false)
  const [userMajor, setUserMajor] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newPosts = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as any),
      }))
      setPosts(newPosts as Post[])
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setUserMajor(null)
        return
      }
      const snap = await getDoc(doc(db, 'users', user.uid))
      setUserMajor((snap.data()?.major as string) ?? null)
    })
    return () => unsub()
  }, [])

  const filteredPosts = posts.filter((post) => {
    if (activeTab === '전체') return true
    if (activeTab === '내 관심사') return userMajor ? post.major === userMajor : false
    return post.category === activeTab
  })

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (sortBy === 'latest') {
      return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
    }
    if (sortBy === 'popular') {
      return (b.likes?.length || 0) - (a.likes?.length || 0)
    }
    if (sortBy === 'comment') {
      return (b.comments?.length || 0) - (a.comments?.length || 0)
    }
    return 0
  })

  return (
    <div className={styles.container}>
      {/* 탭 선택 */}
      <div className={styles.tabs}>
        {(['전체', '궁금해요', '멘토소식', '내 관심사'] as const).map((tab) => (
          <button
            key={tab}
            className={`${styles.tabButton} ${activeTab === tab ? styles.active : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 제목 + 아이콘 */}
      <div className={styles.headerRow}>
        <h2 className={styles.title}>자유게시판</h2>
        <div className={styles.iconGroup}>
          <img src="/sort.svg" alt="정렬" onClick={() => setShowSortMenu(!showSortMenu)} />
          <img src="/search.svg" alt="검색" onClick={() => router.push('/board/search')} />
        </div>
      </div>

      {/* 드롭다운 메뉴 */}
      {showSortMenu && (
        <div className={styles.sortMenu}>
          <button onClick={() => { setSortBy('latest'); setShowSortMenu(false) }}>최신순</button>
          <button onClick={() => { setSortBy('popular'); setShowSortMenu(false) }}>인기순</button>
          <button onClick={() => { setSortBy('comment'); setShowSortMenu(false) }}>댓글순</button>
        </div>
      )}

      {/* 게시글 리스트 / 빈 상태 */}
      {sortedPosts.length === 0 ? (
        <div className={styles.postList}>
          {activeTab === '내 관심사' && (
            <div className={styles.empty}>
              아직 게시글이 없네요..{' '}
              <a className={styles.emptyLink} href="/board/write">게시하러 가세요!</a>
            </div>
          )}
        </div>
      ) : (
        <div className={styles.postList}>
          {sortedPosts.map((post) => (
            <PostCard
              key={post.id}
              id={post.id}
              category={post.category}
              title={post.title}
              authorName={post.authorName}
              authorRole={post.authorRole}
              major={post.major}
              middle={post.middle}
              minor={post.minor}
            />
          ))}
        </div>
      )}

      {/* 글쓰기 버튼 */}
      <button
        className={styles.writeButton}
        onClick={() => (window.location.href = '/board/write')}
      >
        <img src="/write.svg" alt="글쓰기" />
      </button>
    </div>
  )
}
