'use client'
import Link from 'next/link'
import styles from './PostCard.module.css'

interface Props {
  id: string
  category: string
  title: string
  authorName: string
  authorRole: string
  major: string
  middle: string
  minor: string
}

export default function PostCard({
  id,
  category,
  title,
  major,
  middle,
  minor,
  authorName,
  authorRole,
}: Props) {
 
  const cleanedMinor = minor?.replace(/^\d+\./, '')

  return (
    <Link href={`/board/${id}`} className={styles.card}>
  <div className={styles.category}>·{category} · {cleanedMinor}</div>
  <div className={styles.title}>{title}</div>
</Link>
  )
}

