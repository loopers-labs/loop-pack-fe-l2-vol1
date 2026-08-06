import Image from "next/image";
import type { HomeResponse } from "@/_pages/home";
import styles from "./HeroSection.module.css";

type HeroSectionProps = Pick<HomeResponse["banner"], "title" | "description">;

export function HeroSection({ title, description }: HeroSectionProps) {
  return (
    <section className={styles.hero} aria-labelledby="week07-hero-title">
      <Image
        className={styles.image}
        src="/images/week-07/hero-original.jpg"
        alt="따뜻한 자연광이 드는 공간에 진열된 브라운 가죽 토트백, 크림색 스니커즈, 니트 스웨터와 도자기 소품"
        fill
        sizes="(min-width: 1280px) 1280px, 100vw"
        priority
      />
      <div className={styles.copy}>
        <p className={styles.eyebrow}>이번 주의 발견</p>
        <h2 id="week07-hero-title">{title}</h2>
        <p>{description}</p>
      </div>
    </section>
  );
}
