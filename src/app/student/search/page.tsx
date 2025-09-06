'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import styles from './searchstudent.module.css';
import { categoryData } from '@/data/categoryData';
import Image from 'next/image';

export default function StudentHome() {
  const router = useRouter();

  const [major, setMajor] = useState('');
  const [middle, setMiddle] = useState('');
  const [minor, setMinor] = useState('');
  const [trust, setTrust] = useState('');

  const majorList = Object.keys(categoryData);
  const middleList = major ? Object.keys(categoryData[major]) : [];
  const minorList = major && middle ? categoryData[major][middle] : [];

  const handleSearch = () => {
    if (!major) {
      alert('대분류는 반드시 선택해야 합니다.');
      return;
    }

    const query = new URLSearchParams();
    query.append('major', major);
    if (middle) query.append('middle', middle);
    if (minor) query.append('minor', minor);

    // ✅ 신뢰도는 선택적: Firestore의 trustLevel(낮음/중간/높음) 그대로 사용
    if (trust) {
      query.append('trust', trust);          // 화면 표시/유지용
      query.append('trustLevel', trust);     // 결과 쿼리 where('trustLevel','==', trust)
    }

    router.push(`/student/result?${query.toString()}`);
  };

  return (
    <div className={styles.container}>
      {/* 상단 헤더 */}
      <div className={styles.header}>
        <button
          className={styles.backBtn}
          onClick={() => router.push('/student')}
        >
          <Image src="/back.svg" alt="뒤로가기" className={styles.backIcon} />
        </button>
        <div className={styles.title}>멘토 매칭</div>
      </div>

      <div className={styles.section}>
        <div className={styles.label}>기본 설정</div>
        <div className={styles.dropdownRow}>
          {/* 대분류 */}
          <select
            className={styles.selectBox}
            value={major}
            onChange={(e) => {
              setMajor(e.target.value);
              setMiddle('');
              setMinor('');
            }}
          >
            <option value="">대분류</option>
            {majorList.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          {/* 중분류 */}
          <select
            className={styles.selectBox}
            value={middle}
            onChange={(e) => {
              setMiddle(e.target.value);
              setMinor('');
            }}
            disabled={!major}
          >
            <option value="">중분류</option>
            {middleList.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          {/* 소분류 */}
          <select
            className={styles.selectBox}
            value={minor}
            onChange={(e) => setMinor(e.target.value)}
            disabled={!middle}
          >
            <option value="">소분류</option>
            {minorList.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.label}>신뢰도 설정</div>
        <select
          className={styles.selectBox}
          value={trust}
          onChange={(e) => setTrust(e.target.value)}
        >
          <option value="">신뢰도 (선택)</option>
          <option value="높음">높음</option>
          <option value="중간">중간</option>
          <option value="낮음">낮음</option>
        </select>
      </div>

      <button className={styles.searchButton} onClick={handleSearch}>
        멘토 검색하기
      </button>
    </div>
  );
}
