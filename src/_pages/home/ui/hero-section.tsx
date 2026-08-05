import Image from "next/image";
import type { HomeResponse } from "@/types/commerce";
import styles from "./hero-section.module.css";

type HeroSectionProps = Partial<Pick<HomeResponse["banner"], "title" | "description">>;

export function HeroSection({ title, description }: HeroSectionProps) {
  return (
    <section
      className={styles.hero}
      aria-labelledby={title === undefined ? undefined : "week07-hero-title"}
    >
      <Image
        className={styles.image}
        src="/images/week-07/hero-original.jpg"
        alt=""
        width={3840}
        height={2160}
        sizes="100vw"
        priority
      />
      {title !== undefined && (
        <div className={styles.copy}>
          <p className={styles.eyebrow}>이번 주의 발견</p>
          <h2 id="week07-hero-title">{title}</h2>
          <p>{description}</p>
        </div>
      )}
    </section>
  );
}
