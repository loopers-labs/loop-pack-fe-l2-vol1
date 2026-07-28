import Link from 'next/link'
import type { Category } from '@/types/commerce'
import styles from './CategorySection.module.css'

type CategorySectionProps = {
  categories: readonly Category[]
}

export const CategorySection = ({ categories }: CategorySectionProps) => {
  return (
    <section className={styles.section}>
      <h2>카테고리</h2>
      <div className={styles.categories}>
        {categories.map(({ id, name }) => (
          <Link key={id} href={`/products?category=${id}`}>
            {name}
          </Link>
        ))}
      </div>
    </section>
  )
}
