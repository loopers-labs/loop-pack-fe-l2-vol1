import type { Product } from "../types";

type ProductCardProps = {
  product: Product;
  searchQuery: string;
  isWishlisted: boolean;
  onProductClick: (productId: number) => void;
  onWishlistToggle: (productId: number) => void;
};

export function ProductCard({
  product,
  searchQuery,
  isWishlisted,
  onProductClick,
  onWishlistToggle,
}: ProductCardProps) {
  const discountRate = calculateDiscountRate(product);

  const formattedPrice = formatPrice(product.price);

  const formattedOriginalPrice = product.originalPrice ? formatPrice(product.originalPrice) : null;

  const badges = getProductBadges(product, discountRate);

  const isFreeShipping = product.price >= 50000;

  const handleWishlistToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onWishlistToggle(product.id);
  };

  const handleProductClick = () => {
    onProductClick(product.id);
  };

  return (
    <article className="product-card" onClick={handleProductClick}>
      <div className="image-wrap">
        <img src={product.imageUrl} alt={product.name} loading="lazy" />
        {badges.map((badge) => (
          <span key={badge.label} className={badge.className}>
            {badge.label}
          </span>
        ))}
      </div>

      <div className="card-body">
        <h3 className="product-name">{renderHighlightedText(product.name, searchQuery)}</h3>
        <div className="price-area">
          {formattedOriginalPrice && (
            <span className="original-price">{formattedOriginalPrice}</span>
          )}
          <span className="price">{formattedPrice}</span>
          {isFreeShipping && (
            <span
              style={{
                marginLeft: 6,
                fontSize: 11,
                color: "#2e7d32",
                fontWeight: 600,
              }}
            >
              무료배송
            </span>
          )}
        </div>
        <div className="rating-area">
          <span className="rating">★ {product.rating.toFixed(1)}</span>
          <span className="review-count">({product.reviewCount.toLocaleString()})</span>
          <button
            style={{
              marginLeft: "auto",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontSize: 16,
            }}
            onClick={handleWishlistToggle}
            aria-label="위시리스트 토글"
          >
            {isWishlisted ? "♥" : "♡"}
          </button>
        </div>
      </div>
    </article>
  );
}

type ProductBadge = {
  className: string;
  label: string;
};

function calculateDiscountRate(product: Product) {
  if (!product.originalPrice) {
    return 0;
  }

  return Math.round((1 - product.price / product.originalPrice) * 100);
}

function formatPrice(price: number) {
  return `${price.toLocaleString()}원`;
}

function isNewProduct(createdAt: string) {
  const createdDate = new Date(createdAt);
  const now = new Date();
  const daysSinceCreated = Math.floor(
    (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  return daysSinceCreated <= 7;
}

function getProductBadges(product: Product, discountRate: number): ProductBadge[] {
  const badges: ProductBadge[] = [];
  const isAlmostSoldOut = product.stock > 0 && product.stock <= 5;
  const isSoldOut = product.stock === 0;
  const isHot = discountRate >= 30;
  const isBest = product.rating >= 4.5 && product.reviewCount >= 100;

  if (discountRate > 0) {
    badges.push({ className: "badge badge-discount", label: `${discountRate}% 할인` });
  }

  if (isNewProduct(product.createdAt)) {
    badges.push({ className: "badge badge-new", label: "NEW" });
  }

  if (isHot) {
    badges.push({ className: "badge badge-hot", label: "특가" });
  }

  if (isBest) {
    badges.push({ className: "badge badge-best", label: "BEST" });
  }

  if (isSoldOut) {
    badges.push({ className: "badge badge-soldout", label: "품절" });
  }

  if (!isSoldOut && isAlmostSoldOut) {
    badges.push({ className: "badge badge-warning", label: "품절 임박" });
  }

  return badges;
}

function renderHighlightedText(text: string, searchQuery: string) {
  if (!searchQuery) {
    return <>{text}</>;
  }

  const escapedSearchQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escapedSearchQuery})`, "gi"));

  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === searchQuery.toLowerCase() ? (
          <mark key={`${part}-${index}`} style={{ background: "#fff176", padding: 0 }}>
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}
