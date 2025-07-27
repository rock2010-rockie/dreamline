'use client'

import { useEffect, useState } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import styles from './board.module.css'
import PostCard from '../components/PostCard'

interface Post {
  id: string
  title: string
  category: string
  authorName: string
  authorRole: string
  major: string
  middle: string
  minor: string
}

export default function BoardPage() {
  const [activeTab, setActiveTab] = useState<'전체' | '궁금해요' | '멘토소식'>('전체')
  const [posts, setPosts] = useState<Post[]>([])

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newPosts = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as any),
      }))
      setPosts(newPosts)
    })

    return () => unsubscribe()
  }, [])

  const filteredPosts = posts.filter((post) => {
    if (activeTab === '전체') return true
    return post.category === activeTab
  })

  return (
    <div className={styles.container}>
      <div className={styles.tabs}>
        {['전체', '궁금해요', '멘토소식'].map((tab) => (
          <button
            key={tab}
            className={`${styles.tabButton} ${activeTab === tab ? styles.active : ''}`}
            onClick={() => setActiveTab(tab as any)}
          >
            {tab}
          </button>
        ))}
      </div>

      <h2 className={styles.title}>자유게시판</h2>

      <div className={styles.postList}>
        {filteredPosts.map((post) => (
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

      <button
        className={styles.writeButton}
        onClick={() => window.location.href = '/board/write'}
      >
        <img src="/write.svg" alt="글쓰기" />
      </button>
    </div>
  )
}
