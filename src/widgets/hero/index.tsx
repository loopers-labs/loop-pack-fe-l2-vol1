import Image from "next/image";
import styles from "./index.module.css";

type HeroProps = {
  title: string;
  description: string;
};

export function Hero({ title, description }: HeroProps) {
  return (
    <section className={styles.hero} aria-labelledby="week07-hero-title">
      <Image
        className={styles.image}
        src="/images/week-07/hero-original.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
      />
      <div className={styles.copy}>
        <p className={styles.eyebrow}>이번 주의 발견</p>
        <h2 id="week07-hero-title">{title}</h2>
        <p>{description}</p>
      </div>
    </section>
  );
}