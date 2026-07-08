"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useSelect } from "@/components/ui/select";

type ProductSize = {
  value: number;
  stock: number;
};

type Product = {
  id: string;
  name: string;
  price: number;
  originalPrice: number | null;
  image: string;
  freeShipping: boolean;
  sizes: ProductSize[];
};

type ProductsResponse = {
  products: Product[];
  totalCount: number;
};

type ShippingOption = {
  id: string;
  label: string;
  description: string;
  price: number;
  disabled?: boolean;
};

const shippingOptions: ShippingOption[] = [
  {
    id: "standard",
    label: "일반 배송",
    description: "영업일 기준 2-3일",
    price: 3000,
  },
  {
    id: "express",
    label: "빠른 배송",
    description: "내일 도착",
    price: 5000,
  },
  {
    id: "pickup",
    label: "매장 픽업",
    description: "현재 준비 중",
    price: 0,
    disabled: true,
  },
];

const statusLabels = [
  "Default: 회색 테두리",
  "Active: 초록 테두리 + 포커스 링",
  "Selected: 체크 아이콘",
  "Disabled: 흐린 텍스트",
];

const formatPrice = (price: number) => {
  return `${price.toLocaleString()}원`;
};

const getFirstAvailableSize = (sizes: ProductSize[]) => {
  return sizes.find((size) => size.stock > 0) ?? null;
};

export function SelectExamples() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const abortController = new AbortController();

    async function fetchProducts() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch("/api/products", {
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error("상품 옵션을 불러오지 못했습니다.");
        }

        const data = (await response.json()) as ProductsResponse;
        const firstProduct = data.products[0] ?? null;

        setProducts(data.products);
        setSelectedProduct(firstProduct);
        setSelectedSize(firstProduct ? getFirstAvailableSize(firstProduct.sizes) : null);
      } catch (fetchError) {
        if (fetchError instanceof DOMException && fetchError.name === "AbortError") {
          return;
        }

        setError(
          fetchError instanceof Error ? fetchError.message : "알 수 없는 오류가 발생했습니다.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchProducts();

    return () => {
      abortController.abort();
    };
  }, []);

  if (isLoading) {
    return <SelectExamplesMessage>옵션 로딩 중...</SelectExamplesMessage>;
  }

  if (error) {
    return <SelectExamplesMessage variant="error">{error}</SelectExamplesMessage>;
  }

  return (
    <section>
      <ProductListHeader productCount={products.length} />

      <div className="relative z-10 mb-7 flex flex-col gap-2.5 sm:flex-row">
        <ProductSelectField
          products={products}
          selectedProduct={selectedProduct}
          onProductChange={(product) => {
            setSelectedProduct(product);
            setSelectedSize(getFirstAvailableSize(product.sizes));
          }}
        />
        <SizeSelectField
          sizes={selectedProduct?.sizes ?? []}
          selectedSize={selectedSize}
          onSizeChange={setSelectedSize}
        />
        <ShippingSelectField />
      </div>

      <ProductGrid products={products} />
      <SelectSpecNote />
    </section>
  );
}

function SelectExamplesMessage({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "error";
}) {
  const className =
    variant === "error"
      ? "rounded-[14px] border border-[#FF3D3D] bg-[#FFEDED] p-8 text-sm text-[#FF3D3D]"
      : "rounded-[14px] border border-[#E1E1E1] bg-white p-8 text-sm text-[#767676]";

  return <div className={className}>{children}</div>;
}

function ProductListHeader({ productCount }: { productCount: number }) {
  return (
    <div className="mb-5">
      <h1 className="text-[22px] font-extrabold tracking-[-0.02em] text-[#191919]">
        베이글 옵션 전체
      </h1>
      <p className="mt-1 text-[13px] text-[#767676]">
        총 <b className="font-bold text-[#009E30]">{productCount.toLocaleString()}개</b>의 상품이
        있어요
      </p>
    </div>
  );
}

function ProductSelectField({
  products,
  selectedProduct,
  onProductChange,
}: {
  products: Product[];
  selectedProduct: Product | null;
  onProductChange: (product: Product) => void;
}) {
  const productSelect = useSelect({
    items: products,
    selectedItem: selectedProduct,
    onSelectedItemChange: onProductChange,
    itemToString: (item) => item?.name ?? "",
    isItemDisabled: (item) => item.sizes.length === 0,
  });

  return (
    <SelectFieldFrame
      label="상품"
      value={productSelect.selectedItem?.name ?? "상품 선택"}
      isOpen={productSelect.isOpen}
      labelProps={productSelect.getLabelProps()}
      triggerProps={productSelect.getToggleButtonProps()}
      menuProps={productSelect.getMenuProps()}
    >
      {products.map((product, index) => {
        const state = productSelect.getItemState({ item: product, index });

        return (
          <li
            key={product.id}
            className={getOptionClassName(state)}
            {...productSelect.getItemProps({ item: product, index })}
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-[#F5F5F6]">
                <Image src={product.image} alt="" width={24} height={24} />
              </span>
              <span className="min-w-0">
                <span className="block truncate">{product.name}</span>
                <span className="mt-0.5 block text-xs font-normal text-[#767676]">
                  {formatPrice(product.price)}
                </span>
              </span>
            </div>
            <CheckIcon visible={state.selected} />
          </li>
        );
      })}
    </SelectFieldFrame>
  );
}

function SizeSelectField({
  sizes,
  selectedSize,
  onSizeChange,
}: {
  sizes: ProductSize[];
  selectedSize: ProductSize | null;
  onSizeChange: (size: ProductSize) => void;
}) {
  const sizeSelect = useSelect({
    items: sizes,
    selectedItem: selectedSize,
    onSelectedItemChange: onSizeChange,
    itemToString: (item) => (item ? `${item.value}cm` : ""),
    isItemDisabled: (item) => item.stock === 0,
  });

  return (
    <SelectFieldFrame
      label="사이즈"
      value={sizeSelect.selectedItem ? `${sizeSelect.selectedItem.value}cm` : "사이즈 선택"}
      isOpen={sizeSelect.isOpen}
      labelProps={sizeSelect.getLabelProps()}
      triggerProps={sizeSelect.getToggleButtonProps()}
      menuProps={sizeSelect.getMenuProps()}
    >
      {sizes.map((size, index) => {
        const state = sizeSelect.getItemState({ item: size, index });

        return (
          <li
            key={size.value}
            className={getOptionClassName(state)}
            {...sizeSelect.getItemProps({ item: size, index })}
          >
            <span>{size.value}cm</span>
            <span className="ml-auto text-xs font-normal text-[#767676]">
              {size.stock > 0 ? `재고 ${size.stock}` : "품절"}
            </span>
            <CheckIcon visible={state.selected} />
          </li>
        );
      })}
    </SelectFieldFrame>
  );
}

function ShippingSelectField() {
  const shippingSelect = useSelect({
    items: shippingOptions,
    defaultSelectedItem: shippingOptions[0],
    itemToString: (item) => item?.label ?? "",
    isItemDisabled: (item) => item.disabled === true,
  });

  return (
    <SelectFieldFrame
      label="배송"
      value={shippingSelect.selectedItem?.label ?? "배송 방식"}
      isOpen={shippingSelect.isOpen}
      labelProps={shippingSelect.getLabelProps()}
      triggerProps={shippingSelect.getToggleButtonProps()}
      menuProps={shippingSelect.getMenuProps()}
    >
      {shippingOptions.map((option, index) => {
        const state = shippingSelect.getItemState({ item: option, index });

        return (
          <li
            key={option.id}
            className={getOptionClassName(state)}
            {...shippingSelect.getItemProps({ item: option, index })}
          >
            <span>
              <span className="block">{option.label}</span>
              <span className="mt-0.5 block text-xs font-normal text-[#767676]">
                {option.description}
              </span>
            </span>
            <span className="ml-auto text-sm font-medium text-[#4B4B4B]">
              {formatPrice(option.price)}
            </span>
            <CheckIcon visible={state.selected} />
          </li>
        );
      })}
    </SelectFieldFrame>
  );
}

function SelectFieldFrame({
  label,
  value,
  isOpen,
  labelProps,
  triggerProps,
  menuProps,
  children,
}: {
  label: string;
  value: string;
  isOpen: boolean;
  labelProps: React.LabelHTMLAttributes<HTMLLabelElement>;
  triggerProps: React.ButtonHTMLAttributes<HTMLButtonElement>;
  menuProps: React.HTMLAttributes<HTMLUListElement>;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex-1">
      <label className="sr-only" {...labelProps}>
        {label}
      </label>
      <button className={getSelectBoxClassName(isOpen)} {...triggerProps}>
        <span className="min-w-0">
          <span className={selectLabelClassName}>{label}</span>
          <span className={selectValueClassName}>{value}</span>
        </span>
        <ChevronIcon isOpen={isOpen} />
      </button>
      {isOpen && (
        <ul className={selectPanelClassName} {...menuProps}>
          {children}
        </ul>
      )}
    </div>
  );
}

function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  return (
    <article className="overflow-hidden rounded-[12px] border border-[#E1E1E1] bg-white">
      <div className="flex aspect-square items-center justify-center bg-gradient-to-br from-[#EFEFF1] to-[#E4E5E8]">
        <Image src={product.image} alt="" width={72} height={72} />
      </div>
      <div className="p-3.5 pb-4">
        {product.freeShipping && (
          <span className="mb-1.5 inline-block rounded-[5px] bg-[#E6FBEC] px-2 py-1 text-[11px] font-bold text-[#009E30]">
            무료배송
          </span>
        )}
        <h2 className="line-clamp-2 h-[2.8em] text-[13.5px] leading-[1.4] text-[#4B4B4B]">
          {product.name}
        </h2>
        <p className="mt-2 text-[17px] font-extrabold text-[#191919]">
          {product.price.toLocaleString()}
          <span className="ml-1 text-[13px] font-medium text-[#767676]">원</span>
        </p>
      </div>
    </article>
  );
}

function SelectSpecNote() {
  return (
    <div className="mt-12 rounded-[14px] border border-[#E1E1E1] bg-white px-6 py-5">
      <h2 className="text-[15px] font-bold text-[#191919]">Select Box 상태 참고</h2>
      <p className="mt-1 text-[12.5px] leading-6 text-[#767676]">
        GDS Dropdown의 Large 56px, 좌우 16px padding, Label + Value 2 Lines 구조를 참고했습니다.
        선택, 하이라이트, 비활성화, 체크 표시만 사용처에서 스타일링합니다.
      </p>
      <div className="mt-4 flex flex-wrap gap-2 text-[12.5px] text-[#4B4B4B]">
        {statusLabels.map((label) => (
          <span key={label} className="rounded-[8px] bg-[#F5F5F6] px-3 py-2">
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

const selectLabelClassName = "block text-[11px] font-medium leading-[14px] text-[#009E30]";

const selectValueClassName =
  "mt-0.5 block truncate pr-5 text-[15px] font-semibold leading-5 text-[#191919]";

const selectPanelClassName =
  "absolute left-0 right-0 top-[calc(100%+8px)] z-20 max-h-[280px] overflow-y-auto rounded-[10px] border border-[#E1E1E1] bg-white p-1.5 shadow-[0_12px_28px_rgba(25,25,25,0.12),0_2px_6px_rgba(25,25,25,0.06)]";

function getSelectBoxClassName(isOpen: boolean) {
  const classNames = [
    "relative flex h-14 w-full cursor-pointer flex-col justify-center rounded-[10px] border-[1.5px] bg-white px-4 text-left font-[inherit] outline-none transition focus-visible:border-[#00C73C] focus-visible:shadow-[0_0_0_3px_#E6FBEC]",
    isOpen
      ? "border-[#00C73C] shadow-[0_0_0_3px_#E6FBEC]"
      : "border-[#E1E1E1] hover:border-[#C7C7C7]",
  ];

  return classNames.join(" ");
}

function getOptionClassName(state: { selected: boolean; highlighted: boolean; disabled: boolean }) {
  const classNames = [
    "flex cursor-pointer items-center gap-2 rounded-[7px] px-3 py-3 text-sm font-medium text-[#4B4B4B] outline-none transition",
    state.highlighted ? "bg-[#F5F5F6]" : "",
    state.selected ? "bg-[#E6FBEC] font-bold text-[#009E30]" : "",
    state.disabled ? "cursor-not-allowed opacity-35" : "",
  ];

  return classNames.filter(Boolean).join(" ");
}

function ChevronIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      className={`absolute right-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#767676] transition ${
        isOpen ? "rotate-180 text-[#009E30]" : ""
      }`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function CheckIcon({ visible }: { visible: boolean }) {
  return (
    <svg
      className={`h-4 w-4 shrink-0 text-[#00C73C] ${visible ? "visible" : "invisible"}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M5 13l4 4L19 7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.4"
      />
    </svg>
  );
}
