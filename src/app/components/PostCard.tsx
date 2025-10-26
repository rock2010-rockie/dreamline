'use client'
import Link from 'next/link'
import styles from './PostCard.module.css'

interface Props {
  id: string
  category: string
  title: string
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
