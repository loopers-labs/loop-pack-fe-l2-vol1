import styles from "./HeroSection.module.css";
import type { HomeResponse } from "../api/homeApi";

type HeroSectionProps = Pick<HomeResponse["banner"], "title" | "description">;

export function HeroSection({ title, description }: HeroSectionProps) {
  return (
    <section className={styles.hero} aria-labelledby="week07-hero-title">
      <picture className={styles.image}>
        <source media="(max-width: 640px)" srcSet="/images/week-07/hero-mobile-768.webp" />
        <img
          src="/images/week-07/hero-1600.webp"
          alt=""
          width={1600}
          height={900}
          fetchPriority="high"
        />
      </picture>
      <div className={styles.copy}>
        <p className={styles.eyebrow}>이번 주의 발견</p>
        <h2 id="week07-hero-title">{title}</h2>
        <p>{description}</p>
      </div>
    </section>
  );
}
