'use client'
import Link from 'next/link'
import styles from './PostCard.module.css'

interface Props {
  id: string
  category: string
  title: string
  // 현재 카드에서 실제로 쓰는 건 minor뿐.
  // 나머지는 과거 호출부 호환을 위해 "옵셔널"로 둡니다.
  minor?: string
  authorName?: string
  authorRole?: string
  major?: string
  middle?: string
}

export default function PostCard({
  id,
  category,
  title,
  minor,
}: Props) {
  const cleanedMinor = (minor ?? '').replace(/^\d+\.\s*/, '')
  return (
    <Link href={`/board/${id}`} className={styles.card}>
      <div className={styles.category}>·{category} · {cleanedMinor}</div>
      <div className={styles.title}>{title}</div>
    </Link>
  )
}
