import type { HomeResponse } from "@/_pages/home/api/types";
import styles from "./HeroSection.module.css";

type HeroSectionProps = Partial<
  Pick<HomeResponse["banner"], "title" | "description">
>;

export function HeroSection({ title, description }: HeroSectionProps) {
  return (
    <section className={styles.hero} aria-labelledby="week07-hero-title">
      <picture>
        <source
          srcSet="/images/week-07/hero-640.avif 640w, /images/week-07/hero-1080.avif 1080w, /images/week-07/hero-1920.avif 1920w"
          sizes="(max-width: 1280px) 100vw, 1280px"
          type="image/avif"
        />
        <source
          srcSet="/images/week-07/hero-640.webp 640w, /images/week-07/hero-1080.webp 1080w, /images/week-07/hero-1920.webp 1920w"
          sizes="(max-width: 1280px) 100vw, 1280px"
          type="image/webp"
        />
        <img
          className={styles.image}
          src="/images/week-07/hero-1080.webp"
          alt=""
          width={1920}
          height={1080}
          fetchPriority="high"
          loading="eager"
        />
      </picture>
      <div className={styles.overlay}>
        <div className={styles.top}>
          <span className={styles.badge}>이번 주의 발견</span>
        </div>
        {title && (
          <div className={styles.bottom}>
            <h2 id="week07-hero-title" className={styles.title}>{title}</h2>
            {description && (
              <p className={styles.description}>{description}</p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
