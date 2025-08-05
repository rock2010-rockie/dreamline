'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
  arrayUnion,
  arrayRemove,
  addDoc,
  query,
  orderBy,
} from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import styles from './postDetail.module.css'

interface Comment {
  id: string
  text: string
  authorName: string
  authorRole: string
}

export default function PostDetailPage() {
  const { id } = useParams()
  const [post, setPost] = useState<any>(null)
  const [liked, setLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const [comment, setComment] = useState('')
  const [comments, setComments] = useState<Comment[]>([])

  useEffect(() => {
    const fetchPost = async () => {
      const docRef = doc(db, 'posts', id as string)
      const snapshot = await getDoc(docRef)
      const data = snapshot.data()
      if (!data) return
      setPost(data)
      setLikesCount(data.likes?.length || [])

      const user = auth.currentUser
      if (user && data.likes?.includes(user.uid)) {
        setLiked(true)
      }
    }

    const unsubscribeComments = onSnapshot(
      query(
        collection(db, 'posts', id as string, 'comments'),
        orderBy('createdAt', 'asc')
      ),
      (snapshot) => {
        const newComments = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Comment[]
        setComments(newComments)
      }
    )

    fetchPost()
    return () => unsubscribeComments()
  }, [id])

  const handleLike = async () => {
    const user = auth.currentUser
    if (!user || !post) return

    const postRef = doc(db, 'posts', id as string)

    if (liked) {
      await updateDoc(postRef, {
        likes: arrayRemove(user.uid),
      })
      setLiked(false)
      setLikesCount((prev) => prev - 1)
    } else {
      await updateDoc(postRef, {
        likes: arrayUnion(user.uid),
      })
      setLiked(true)
      setLikesCount((prev) => prev + 1)
    }
  }

  const handleCommentSubmit = async () => {
    const user = auth.currentUser
    if (!user || !comment.trim()) return

    const userDoc = await getDoc(doc(db, 'users', user.uid))
    const userData = userDoc.data()

    await addDoc(collection(db, 'posts', id as string, 'comments'), {
      text: comment,
      authorName: userData?.name || '익명',
      authorRole: userData?.role || 'student',
      createdAt: new Date(),
    })

    setComment('')
  }

  if (!post) return <div>로딩 중...</div>

  return (
    <div className={styles.container}>
      <button className={styles.backBtn} onClick={() => history.back()}>
        &lt;
      </button>

      {/* ✅ 글쓴이 정보 (위로 이동) */}
      <div className={styles.userInfo}>
        <img src="/user.svg" alt="유저 아이콘" className={styles.userIcon} />
        <div className={styles.nameBox}>
          <div className={styles.name}>
            {post.authorName}
            {auth.currentUser?.uid === post.authorId && (
              <span className={styles.authorBadge}> 글쓴이</span>
            )}
          </div>
          <div className={styles.role}>{post.authorRole}</div>
        </div>
      </div>

      {/* 제목 */}
      <h2 className={styles.title}>{post.title}</h2>

      {/* 이미지 */}
      {post.imageUrl && (
        <img src={post.imageUrl} alt="첨부 이미지" className={styles.image} />
      )}

      {/* 본문 */}
      <p className={styles.content}>{post.content}</p>

      <hr className={styles.divider} />

      {/* 좋아요 */}
      <div className={styles.likeBox} onClick={handleLike}>
        <img
          src={liked ? '/redheart.svg' : '/heart.svg'}
          alt="좋아요"
          className={styles.heartIcon}
        />
        <span className={styles.likeCount}>{likesCount}</span>
      </div>

      {/* 댓글 목록 */}
      {comments.map((c) => (
        <div key={c.id} className={styles.comment}>
          <img src="/user.svg" className={styles.commentIcon} alt="유저" />
          <div>
            <div className={styles.commentAuthor}>
              <strong>{c.authorName}</strong> · {c.authorRole}
            </div>
            <div>{c.text}</div>
          </div>
        </div>
      ))}

      {/* 댓글 입력창 */}
      <div className={styles.commentInputBox}>
        <input
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="다양한 의견을 남겨주세요!"
          className={styles.commentInput}
        />
        <button onClick={handleCommentSubmit} className={styles.submitBtn}>
          등록
        </button>
      </div>
    </div>
  )
}
