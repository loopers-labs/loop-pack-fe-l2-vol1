import styles from './HeroBanner.module.css'

type HeroBannerProps = {
  banner: { title: string; description: string; image: string }
}

export const HeroBanner = ({ banner }: HeroBannerProps) => {
  return (
    <section
      className={styles.hero}
      // 이미지가 있을 때만 배경으로 얹는다. 없으면 CSS의 회색 배경을 그대로 둔다.
      style={banner.image ? { backgroundImage: `url("${banner.image}")` } : undefined}
    >
      <p>{banner.description}</p>
      <h1>{banner.title}</h1>
    </section>
  )
}
