'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
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
  where,
  getDocs,
  limit as fsLimit,
  serverTimestamp,
} from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import styles from './postDetail.module.css'
import Image from 'next/image'

type Role = 'mentor' | 'student' | string

// ✅ 게시글 문서 타입
interface PostDoc {
  authorId?: string
  authorName?: string
  authorRole?: Role
  title?: string
  content?: string
  likes?: string[]            // uid 배열
}

interface Comment {
  id: string
  text: string
  authorName: string
  authorRole: Role
  authorId?: string
}

// ✅ 댓글 원본 문서 타입
type CommentDoc = {
  text?: string
  authorName?: string
  authorRole?: Role
  authorId?: string
  // createdAt?: Timestamp  // (표시는 안 쓰지만 참고용)
}

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>()   // ✅ 제네릭으로 string 보장
  const router = useRouter()

  const [post, setPost] = useState<PostDoc | null>(null)   // ✅ any 제거
  const [liked, setLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const [comment, setComment] = useState('')
  const [comments, setComments] = useState<Comment[]>([])

  // 역할 문자열 정규화 (한글/영문 모두 허용)
  const normalizeRole = (raw?: unknown): 'mentor' | 'student' | null => { // ✅ any → unknown
    if (raw == null) return null
    const s = String(raw).trim().toLowerCase()
    if (s === 'mentor' || s === '멘토') return 'mentor'
    if (s === 'student' || s === '학생') return 'student'
    return null
  }

  // 이름+역할로 users에서 uid 찾기 (authorId 누락 대비)
  const findUserIdByNameRole = async (name?: string, rawRole?: Role): Promise<string | null> => {
    const role = normalizeRole(rawRole)
    if (!name || !role) return null
    const q = query(
      collection(db, 'users'),
      where('name', '==', name),
      where('role', '==', role),
      fsLimit(1)
    )
    const snap = await getDocs(q)
    if (snap.empty) return null
    return snap.docs[0].id
  }

  // 최종 이동
  const goToRequestPage = (uid: string, role: 'mentor' | 'student') => {
    const path =
      role === 'mentor'
        ? `/student/mentor/${uid}` // 학생 -> 멘토
        : `/mentor/${uid}`         // 멘토 -> 학생
    console.log('[goTo]', { uid, role, path })
    router.push(path)
    // 혹시 라우터가 막힌 환경 대비
    setTimeout(() => {
      if (location.pathname !== path) window.location.href = path
    }, 120)
  }

  // 아이콘 클릭 (id 없으면 users에서 역추적)
  const handleUserClick = async (maybeId?: string, rawRole?: Role, nameHint?: string) => {
    try {
      let role = normalizeRole(rawRole)
      if (!role && maybeId) {
        const u = await getDoc(doc(db, 'users', maybeId))
        role = normalizeRole(u.data()?.role)
      }
      let uid: string | null = maybeId || null
      if (!uid) uid = await findUserIdByNameRole(nameHint, (role ?? rawRole) as Role | undefined)
      if (!uid || !role) {
        alert('이동할 사용자 정보를 찾지 못했어요.')
        return
      }
      goToRequestPage(uid, role)
    } catch (e) {
      console.error(e)
      alert('페이지 이동 중 오류가 발생했어요.')
    }
  }

  useEffect(() => {
    const fetchPost = async () => {
      const docRef = doc(db, 'posts', id)
      const snapshot = await getDoc(docRef)
      const data = snapshot.data() as PostDoc | undefined
      if (!data) return
      setPost(data)
      setLikesCount(data.likes?.length || 0)

      const user = auth.currentUser
      if (user && (data.likes ?? []).includes(user.uid)) setLiked(true)
    }

    const unsub = onSnapshot(
      query(collection(db, 'posts', id, 'comments'), orderBy('createdAt', 'asc')),
      (snap) => {
        const list = snap.docs.map((d) => {
          const c = d.data() as CommentDoc
          return {
            id: d.id,
            text: c.text ?? '',
            authorName: c.authorName ?? '익명',
            authorRole: c.authorRole ?? 'student',
            authorId: c.authorId,
          } as Comment
        })
        setComments(list)
      }
    )

    fetchPost()
    return () => unsub()
  }, [id])

  const handleLike = async () => {
    const user = auth.currentUser
    if (!user || !post) return
    const postRef = doc(db, 'posts', id)

    if (liked) {
      await updateDoc(postRef, { likes: arrayRemove(user.uid) })
      setLiked(false)
      setLikesCount((p) => p - 1)
    } else {
      await updateDoc(postRef, { likes: arrayUnion(user.uid) })
      setLiked(true)
      setLikesCount((p) => p + 1)
    }
  }

  const handleCommentSubmit = async () => {
    const user = auth.currentUser
    if (!user || !comment.trim()) return
    const userDoc = await getDoc(doc(db, 'users', user.uid))
    const userData = userDoc.data() as { name?: string; role?: Role } | undefined

    await addDoc(collection(db, 'posts', id, 'comments'), {
      text: comment.trim(),
      authorName: userData?.name || '익명',
      authorRole: userData?.role || 'student',
      authorId: user.uid,              // ← 이후 클릭 이동에 필수
      createdAt: serverTimestamp(),
    })
    setComment('')
  }

  if (!post) return <div>로딩 중...</div>

  return (
    <div className={styles.container}>
      <button className={styles.backBtn} onClick={() => history.back()}>
        &lt;
      </button>

      {/* 글쓴이 */}
      <div className={styles.userInfo}>
        <Image
          src="/user.svg"
          alt="유저 아이콘"
          className={styles.userIcon}
          onClick={() => handleUserClick(post.authorId, post.authorRole, post.authorName)}
          style={{ cursor: 'pointer' }}
          title="요청/상세로 이동"
        />
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

      {/* 본문 */}
      <p className={styles.content}>{post.content}</p>

      {/* 좋아요 */}
      <div className={styles.likeBox} onClick={handleLike}>
        <Image
          src={liked ? '/redheart.svg' : '/heart.svg'}
          alt="좋아요"
          className={styles.heartIcon}
        />
        <span className={styles.likeCount}>{likesCount}</span>
      </div>

      {/* 구분선 */}
      <hr className={styles.sectionDivider} />

      {/* 댓글 목록 */}
      {comments.map((c) => (
        <div key={c.id} className={styles.comment}>
          <Image
            src="/user.svg"
            className={styles.commentIcon}
            alt="유저"
            onClick={() => handleUserClick(c.authorId, c.authorRole, c.authorName)}
            style={{ cursor: 'pointer' }}
            title="요청/상세로 이동"
          />
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
