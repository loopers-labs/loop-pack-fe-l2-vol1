import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import Image from 'next/image';
import { connection } from 'next/server';
import { Suspense } from 'react';

import styles from './HeroSection.module.css';
import { HomeContent } from './HomeContent';

import { productQueries } from '@/entities/product';
import { getQueryClient } from '@/shared/get-query-client';

/**
 * Hero 이미지와 오버레이 카드는 홈 조회 결과를 쓰지 않으므로 셸에 두어 첫 청크에 실어 보낸다.
 * 이미지가 초기 HTML에 있어야 브라우저가 조회를 기다리지 않고 바로 내려받는다.
 */
export function HomePage() {
  return (
    <>
      <section className={styles.hero} aria-label="이번 주의 발견">
        <Image
          className={styles.image}
          src="/images/week-07/hero-original.jpg"
          alt=""
          width={3840}
          height={2160}
          sizes="(max-width: 1232px) 100vw, 1200px"
          loading="eager"
        />

        <div className={styles.copy}>
          <p className={styles.eyebrow}>이번 주의 발견</p>

          <Suspense>
            <HeroCopy />
          </Suspense>
        </div>
      </section>

      <Suspense
        fallback={
          <p className="week05-status" role="status">
            홈을 불러오는 중입니다…
          </p>
        }
      >
        <HomePageContent />
      </Suspense>
    </>
  );
}

async function HomePageContent() {
  const queryClient = await fetchHome();

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HomeContent />
    </HydrationBoundary>
  );
}

export async function HeroCopy() {
  const queryClient = await fetchHome();
  const banner = queryClient.getQueryData(
    productQueries.home().queryKey,
  )?.banner;

  // 조회가 실패해도 이미지와 카드는 그대로 두고 문구만 비운다. 오류 화면은 HomeContent가 맡는다.
  if (!banner) return null;

  return (
    <>
      <h2>{banner.title}</h2>
      <p>{banner.description}</p>
    </>
  );
}

/**
 * 두 경계가 각각 부르지만 React가 같은 render의 동일 GET을 합쳐 실제 호출은 한 번이다.
 * prefetchQuery는 실패해도 던지지 않아 조회 오류가 라우트 error 화면으로 번지지 않는다.
 */
async function fetchHome() {
  // 빌드 중이 아니라 실제 요청이 들어온 뒤에 내부 API를 부르게 한다.
  await connection();

  const queryClient = getQueryClient();

  await queryClient.prefetchQuery(productQueries.home());

  return queryClient;
}
