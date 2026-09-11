'use client';

import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import styles from './CartPage.module.css';

import { useCart, useCartActions, type CartItem } from '@/entities/cart';
import { useCheckoutActions } from '@/entities/order';
import { productQueries, type Product } from '@/entities/product';
import { sessionQueries } from '@/entities/session';
import { LoginRequiredDialog } from '@/features/auth';

export function CartPage() {
  return (
    <section className="week05-section" aria-labelledby="cart-title">
      <h1 id="cart-title">장바구니</h1>
      <CartContent />
    </section>
  );
}

function CartContent() {
  const router = useRouter();

  const {
    data: user,
    isError: isSessionError,
    refetch: refetchSession,
  } = useQuery(sessionQueries.me());
  const items = useCart((cart) => cart.items);
  const { setAllChecked } = useCartActions();
  const { createCheckoutDraft } = useCheckoutActions();

  const {
    data: catalogProducts,
    isPending: isCatalogPending,
    isError: isCatalogError,
    refetch: refetchCatalog,
  } = useQuery({
    ...productQueries.catalog(),
    // 담긴 상품이 없으면 이름·가격을 붙일 곳이 없다. 전체 페이지 조회라 요청 자체를 막는다.
    enabled: (items?.length ?? 0) > 0,
  });

  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);

  if (!items) {
    return <p className={styles.statusText}>장바구니를 불러오는 중</p>;
  }

  if (items.length === 0) {
    return (
      <>
        <p>장바구니가 비어 있습니다.</p>
        <Link href="/products">상품 보러 가기</Link>
      </>
    );
  }

  const selectedItems = items.filter((item) => item.checked);
  const productById = new Map(
    (catalogProducts ?? []).map((product) => [product.id, product]),
  );
  const selectedTotalPrice =
    catalogProducts === undefined
      ? undefined
      : selectedItems.reduce<number | undefined>(
          (sum, { productId, quantity }) => {
            const product = productById.get(productId);

            return sum === undefined || !product
              ? undefined
              : sum + quantity * product.price;
          },
          0,
        );
  const canPurchase =
    selectedItems.length > 0 &&
    selectedTotalPrice !== undefined &&
    user !== undefined;

  const handleToggleAllChecked = () => {
    setAllChecked(!items.every((item) => item.checked));
  };

  const handlePurchaseClick = () => {
    if (!canPurchase) return;

    // 구매 의사를 확정하는 순간, 선택 상품·수량을 주문 예정 목록(draft)으로 스냅샷 뜬다
    createCheckoutDraft(selectedItems);

    if (user === null) {
      setIsLoginDialogOpen(true);

      return;
    }

    // draft가 주문 내용을 들고 있으므로 상품 ID를 URL에 싣지 않는다
    router.push('/orders/new');
  };

  return (
    <>
      {/* 세션 확인 실패는 비로그인이 아니므로 로그인 안내 대신 재시도를 받는다 */}
      {isSessionError && user === undefined && (
        <p role="alert">
          로그인 상태를 확인하지 못했습니다.
          <button
            type="button"
            onClick={() => {
              void refetchSession();
            }}
          >
            다시 시도
          </button>
        </p>
      )}
      {isCatalogError && (
        <p role="alert">
          상품 정보를 불러오지 못했습니다.
          <button
            type="button"
            onClick={() => {
              void refetchCatalog();
            }}
          >
            다시 시도
          </button>
        </p>
      )}

      <div className={styles.layout}>
        <ul className={styles.list}>
          <li className={styles.selectAllRow}>
            <label className={styles.selectAllLabel}>
              <input
                type="checkbox"
                checked={items.every((item) => item.checked)}
                onChange={handleToggleAllChecked}
              />
              전체 선택
            </label>
          </li>
          {items.map((item) => (
            <CartItemRow
              key={item.productId}
              item={item}
              product={productById.get(item.productId)}
              isProductPending={isCatalogPending}
            />
          ))}
        </ul>

        <aside className={styles.summary} aria-labelledby="cart-summary-title">
          <h2 id="cart-summary-title" className={styles.summaryTitle}>
            주문 예상 금액
          </h2>
          <p className={styles.summaryRow}>
            <span>총 상품 가격</span>
            {selectedTotalPrice === undefined && isCatalogPending ? (
              <span className={styles.amountSkeleton} aria-hidden />
            ) : selectedTotalPrice === undefined ? (
              <span>계산 불가</span>
            ) : (
              <span>{selectedTotalPrice.toLocaleString()}원</span>
            )}
          </p>
          <p className={styles.summaryTotal}>
            <span>합계</span>
            {selectedTotalPrice === undefined && isCatalogPending ? (
              <span className={styles.amountSkeleton} aria-hidden />
            ) : selectedTotalPrice === undefined ? (
              <strong>계산 불가</strong>
            ) : (
              <strong>{selectedTotalPrice.toLocaleString()}원</strong>
            )}
          </p>
          <button
            type="button"
            className={styles.purchaseButton}
            disabled={!canPurchase}
            onClick={handlePurchaseClick}
          >
            {selectedItems.length > 0
              ? `총 ${selectedItems.length}개 상품 구매하기`
              : '구매하기'}
          </button>
        </aside>
      </div>

      <LoginRequiredDialog
        open={isLoginDialogOpen}
        onOpenChange={setIsLoginDialogOpen}
        redirectPathAfterLogin="/orders/new"
        loginFrom="cart"
      />
    </>
  );
}

function CartItemRow({
  item,
  product,
  isProductPending,
}: {
  item: CartItem;
  product?: Product;
  isProductPending: boolean;
}) {
  const { toggleChecked, setQuantity, removeItems } = useCartActions();
  const { productId, quantity, checked } = item;
  const productLabel = product?.name ?? productId;
  const [quantityInput, setQuantityInput] = useState<string | null>(null);

  return (
    <li className={styles.row}>
      <label className={styles.product}>
        <input
          type="checkbox"
          className={styles.checkbox}
          // 상품 정보 로딩 중에도 접근성 이름과 조작은 유지한다
          aria-label={productLabel}
          checked={checked}
          onChange={() => {
            toggleChecked(productId);
          }}
        />
        {product ? (
          <Image
            className={styles.thumbnail}
            src={product.image}
            alt=""
            width={88}
            height={88}
          />
        ) : (
          isProductPending && (
            <span className={styles.thumbnailSkeleton} aria-hidden />
          )
        )}
        <span className={styles.info}>
          {product ? (
            <>
              <span className={styles.name}>{product.name}</span>
              <strong className={styles.price}>
                {product.price.toLocaleString()}원
              </strong>
            </>
          ) : isProductPending ? (
            <>
              <span className={styles.nameSkeleton} aria-hidden />
              <span className={styles.priceSkeleton} aria-hidden />
            </>
          ) : (
            <span className={styles.name}>{productId}</span>
          )}
        </span>
      </label>

      <div className={styles.stepper}>
        <button
          type="button"
          className={styles.stepperButton}
          aria-label={`${productLabel} 수량 줄이기`}
          disabled={quantity === 1}
          onClick={() => {
            setQuantity(productId, quantity - 1);
          }}
        >
          -
        </button>
        <input
          type="number"
          inputMode="numeric"
          min={1}
          max={Number.MAX_SAFE_INTEGER}
          step={1}
          required
          className={styles.quantity}
          aria-label={`${productLabel} 수량`}
          title="1 이상의 정수를 입력하세요. 잘못된 입력은 마지막 수량으로 복원됩니다."
          value={quantityInput ?? quantity}
          onChange={(event) => {
            setQuantityInput(event.currentTarget.value);
            setQuantity(productId, event.currentTarget.valueAsNumber);
          }}
          onBlur={() => {
            setQuantityInput(null);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur();
          }}
        />
        <button
          type="button"
          className={styles.stepperButton}
          aria-label={`${productLabel} 수량 늘리기`}
          onClick={() => {
            setQuantity(productId, quantity + 1);
          }}
        >
          +
        </button>
      </div>

      <button
        type="button"
        className={styles.removeButton}
        aria-label={`${productLabel} 삭제`}
        onClick={() => {
          removeItems([productId]);
        }}
      >
        삭제
      </button>
    </li>
  );
}
