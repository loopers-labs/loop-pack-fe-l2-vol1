import type { ProductCardItem } from '@/widgets/product-card/model/types'
import { ProductCard } from '@/widgets/product-card/ui/ProductCard'
import styles from './ProductGrid.module.css'

type ProductGridProps = {
  products: readonly ProductCardItem[]
  titleLevel: 2 | 3
}

export const ProductGrid = ({ products, titleLevel }: ProductGridProps) => {
  return (
    <div className={styles.grid}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} titleLevel={titleLevel} />
      ))}
    </div>
  )
}
