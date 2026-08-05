import Image from 'next/image';

import styles from './HeroSection.module.css';

import type { HomeResponse } from '@/entities/product';

type HeroSectionProps = Pick<HomeResponse['banner'], 'title' | 'description'>;

export function HeroSection({ title, description }: HeroSectionProps) {
  return (
    <section className={styles.hero} aria-labelledby="week07-hero-title">
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
        <h2 id="week07-hero-title">{title}</h2>
        <p>{description}</p>
      </div>
    </section>
  );
}
