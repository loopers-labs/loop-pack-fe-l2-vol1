'use client';

import { useSuspenseQuery } from '@tanstack/react-query';

import { homeQueryOptions } from '../api/homeQueries';
import styles from './HeroSection.module.css';

/**
 * Hero 의 문구. 홈 데이터에 의존하는 유일한 부분이라 여기만 suspend 한다.
 * 뼈대(HeroSection)와 배경 이미지는 이 경계 밖에 있어 데이터를 기다리지 않는다.
 */
export function HeroCopy() {
  const { data } = useSuspenseQuery(homeQueryOptions.list());

  return (
    <>
      <p className={styles.eyebrow}>이번 주의 발견</p>
      <h2>{data.banner.title}</h2>
      <p>{data.banner.description}</p>
    </>
  );
}

/**
 * 문구 자리를 미리 차지하는 fallback.
 *
 * 실제 문구와 같은 태그(p.eyebrow / h2 / p)를 그대로 써서
 * `.copy` 의 font-size·line-height·margin 을 함께 상속받는다.
 * 막대 높이는 `1em` 이라 브레이크포인트가 바뀌어도 글자 높이를 따라간다.
 */
export function HeroCopyFallback() {
  return (
    <div className={styles.copyFallback} aria-hidden="true">
      <p className={styles.eyebrow}>
        <span className={styles.bar} />
      </p>
      <h2>
        <span className={styles.bar} />
        <span className={`${styles.bar} ${styles.barShort}`} />
      </h2>
      <p>
        <span className={styles.bar} />
      </p>
    </div>
  );
}
