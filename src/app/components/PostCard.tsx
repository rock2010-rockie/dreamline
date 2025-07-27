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
  const cleanedMajor = major?.replace(/^\d+\./, '')
  const cleanedMiddle = middle?.replace(/^\d+\./, '')
  const cleanedMinor = minor?.replace(/^\d+\./, '')

  return (
    <Link href={`/board/${id}`} legacyBehavior>
      <a className={styles.card}>
        <div className={styles.category}>
          ·{category} · {cleanedMajor}/{cleanedMiddle}/{cleanedMinor}
        </div>
        <div className={styles.title}>{title}</div>
        {/* 아래는 선택사항: 작성자 보여줄 경우 */}
        {/* <div className={styles.author}>by {authorName} ({authorRole})</div> */}
      </a>
    </Link>
  )
}

