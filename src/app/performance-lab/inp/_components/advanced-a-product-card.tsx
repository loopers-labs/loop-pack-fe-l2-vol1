import Image from "next/image";
import type { AdvancedAProduct } from "../_data/advanced-a-products";
import { runRequiredCardCalculation } from "../_lib/required-card-calculation";
import styles from "../performance-lab.module.css";

type AdvancedAProductCardProps = {
  product: AdvancedAProduct;
  isFavorite: boolean;
  onToggleFavorite: (productId: string) => void;
};

export function AdvancedAProductCard({
  product,
  isFavorite,
  onToggleFavorite,
}: AdvancedAProductCardProps) {
  const calculation = runRequiredCardCalculation(product);

  return (
    <article
      className={styles.card}
      data-week07-card-id={product.id}
      data-week07-required-work={calculation.workUnits}
    >
      <div className={styles.imageFrame}>
        <Image
          alt={`${product.name} 상품 이미지`}
          className={styles.productImage}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1080px) 33vw, 220px"
          src={product.imageUrl}
        />
        <span className={styles.cardSequence}>
          {product.calculationSeed.toString().padStart(2, "0")}
        </span>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.cardHeading}>
          <div>
            <p className={styles.category}>{product.category}</p>
            <h2>{product.name}</h2>
          </div>
          <button
            aria-label={`${product.name} ${isFavorite ? "찜 해제" : "찜하기"}`}
            aria-pressed={isFavorite}
            className={styles.favoriteButton}
            onClick={() => onToggleFavorite(product.id)}
            type="button"
          >
            <span aria-hidden="true">{isFavorite ? "♥" : "♡"}</span>
          </button>
        </div>

        <p className={styles.price}>{product.price.toLocaleString("ko-KR")}원</p>

        <dl className={styles.calculation}>
          <div>
            <dt>적립 예정</dt>
            <dd>{calculation.rewardPoints.toLocaleString("ko-KR")}P</dd>
          </div>
          <div>
            <dt>배송 준비 지수</dt>
            <dd>{calculation.shippingReadiness}</dd>
          </div>
        </dl>
        <p className={styles.workUnits}>
          필수 화면 계산 · 작업량 {calculation.workUnits.toLocaleString("ko-KR")}
        </p>
      </div>
    </article>
  );
}
