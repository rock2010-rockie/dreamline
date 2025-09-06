'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import styles from './mentorHome.module.css';
import { categoryData } from '@/data/categoryData';

export default function StudentHome() {
  const router = useRouter();

  const [major, setMajor] = useState('');
  const [middle, setMiddle] = useState('');
  const [minor, setMinor] = useState('');
  const [trust] = useState(''); // ✅ setTrust 제거

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
    if (trust) query.append('trust', trust);

    router.push(`/mentor/result?${query.toString()}`);
  };

  return (
    <div className={styles.container}>
      <div className={styles.title}>학생 매칭</div>

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

      <button className={styles.searchButton} onClick={handleSearch}>
        학생 검색하기
      </button>
    </div>
  );
}
