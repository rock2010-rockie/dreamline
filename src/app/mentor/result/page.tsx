'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  collection,
  query,
  where,
  getDocs,
  QueryConstraint,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

type StudentType = {
  id: string
  name: string
  category?: {
    major?: string
    middle?: string
    minor?: string
  }
}

export default function MentorResult() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const major = searchParams.get('major')
  const middle = searchParams.get('middle')
  const minor = searchParams.get('minor')

  const [students, setStudents] = useState<StudentType[]>([])

  useEffect(() => {
    const fetchStudents = async () => {
      const constraints: QueryConstraint[] = [
        where('role', '==', 'student'),
      ]

      if (major) constraints.push(where('major', '==', major))
      if (middle) constraints.push(where('middle', '==', middle))
      if (minor) constraints.push(where('minor', '==', minor))

      const q = query(collection(db, 'users'), ...constraints)
      const snapshot = await getDocs(q)

      const data: StudentType[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as StudentType[]

      console.log('검색 결과:', data)
      setStudents(data)
    }

    fetchStudents()
  }, [major, middle, minor])

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '16px' }}>
        학생 둘러보기
      </h2>

      {students.length === 0 ? (
        <p style={{ color: '#aaa', textAlign: 'center', marginTop: '40px' }}>
          아직 학생이 없어요..
        </p>
      ) : (
        students.map((student) => (
          <div
            key={student.id}
            style={{
              border: '1px solid #ccc',
              padding: '10px',
              marginBottom: '10px',
              cursor: 'pointer',
              borderRadius: '8px',
            }}
            onClick={() => router.push(`/mentor/${student.id}`)}
          >
            <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{student.name}</div>
            <div style={{ fontSize: '14px', color: '#444' }}>
              관심분야: {student.category?.major} / {student.category?.middle} /{' '}
              {student.category?.minor}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
