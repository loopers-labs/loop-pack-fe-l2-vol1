export type Product =
  | { id: string; name: string; optionKind: "size"; options: SizeOption[] }
  | { id: string; name: string; optionKind: "thumbnail"; options: ThumbnailOption[] }
  | { id: string; name: string; optionKind: "bundle"; options: BundleOption[] };

export interface SizeOption {
  id: string;
  value: number;
  deliveryText: string;
  stock: number;
}

export interface ThumbnailOption {
  id: string;
  thumbnail: string;
  label: string;
  discountRate: number;
  price: number;
  shippingBadge: string;
  stock: number;
}

export interface BundleOption {
  id: string;
  label: string;
  price: number;
  unitPrice: number;
  stock: number;
}

type ProductOptionKind = Product["optionKind"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isNumber(value: unknown): value is number {
  return typeof value === "number";
}

function isProductOptionKind(value: unknown): value is ProductOptionKind {
  return value === "size" || value === "thumbnail" || value === "bundle";
}

function assertSizeOption(value: unknown, context: string): asserts value is SizeOption {
  if (!isRecord(value)) {
    throw new Error(`${context}가 객체가 아닙니다.`);
  }
  if (!isString(value.id)) {
    throw new Error(`${context}.id가 string이 아닙니다.`);
  }
  if (!isNumber(value.value)) {
    throw new Error(`${context}.value가 number가 아닙니다.`);
  }
  if (!isString(value.deliveryText)) {
    throw new Error(`${context}.deliveryText가 string이 아닙니다.`);
  }
  if (!isNumber(value.stock)) {
    throw new Error(`${context}.stock이 number가 아닙니다.`);
  }
}

function assertThumbnailOption(value: unknown, context: string): asserts value is ThumbnailOption {
  if (!isRecord(value)) {
    throw new Error(`${context}가 객체가 아닙니다.`);
  }
  if (!isString(value.id)) {
    throw new Error(`${context}.id가 string이 아닙니다.`);
  }
  if (!isString(value.thumbnail)) {
    throw new Error(`${context}.thumbnail이 string이 아닙니다.`);
  }
  if (!isString(value.label)) {
    throw new Error(`${context}.label이 string이 아닙니다.`);
  }
  if (!isNumber(value.discountRate)) {
    throw new Error(`${context}.discountRate가 number가 아닙니다.`);
  }
  if (!isNumber(value.price)) {
    throw new Error(`${context}.price가 number가 아닙니다.`);
  }
  if (!isString(value.shippingBadge)) {
    throw new Error(`${context}.shippingBadge가 string이 아닙니다.`);
  }
  if (!isNumber(value.stock)) {
    throw new Error(`${context}.stock이 number가 아닙니다.`);
  }
}

function assertBundleOption(value: unknown, context: string): asserts value is BundleOption {
  if (!isRecord(value)) {
    throw new Error(`${context}가 객체가 아닙니다.`);
  }
  if (!isString(value.id)) {
    throw new Error(`${context}.id가 string이 아닙니다.`);
  }
  if (!isString(value.label)) {
    throw new Error(`${context}.label이 string이 아닙니다.`);
  }
  if (!isNumber(value.price)) {
    throw new Error(`${context}.price가 number가 아닙니다.`);
  }
  if (!isNumber(value.unitPrice)) {
    throw new Error(`${context}.unitPrice가 number가 아닙니다.`);
  }
  if (!isNumber(value.stock)) {
    throw new Error(`${context}.stock이 number가 아닙니다.`);
  }
}

function assertProduct(value: unknown, index: number): asserts value is Product {
  const context = `products[${index}]`;

  if (!isRecord(value)) {
    throw new Error(`${context}가 객체가 아닙니다.`);
  }
  if (!isString(value.id)) {
    throw new Error(`${context}.id가 string이 아닙니다.`);
  }
  if (!isString(value.name)) {
    throw new Error(`${context}.name이 string이 아닙니다.`);
  }
  if (!Array.isArray(value.options)) {
    throw new Error(`${context}.options가 배열이 아닙니다.`);
  }
  const options = value.options;

  const optionKind = value.optionKind;
  if (!isProductOptionKind(optionKind)) {
    throw new Error(`${context}.optionKind가 올바르지 않습니다: ${String(optionKind)}`);
  }

  switch (optionKind) {
    case "size":
      options.forEach((option, optionIndex) =>
        assertSizeOption(option, `${context}.options[${optionIndex}]`),
      );
      return;
    case "thumbnail":
      options.forEach((option, optionIndex) =>
        assertThumbnailOption(option, `${context}.options[${optionIndex}]`),
      );
      return;
    case "bundle":
      options.forEach((option, optionIndex) =>
        assertBundleOption(option, `${context}.options[${optionIndex}]`),
      );
      return;
    default: {
      const _exhaustive: never = optionKind;
      throw new Error(`${context}.optionKind가 올바르지 않습니다: ${String(_exhaustive)}`);
    }
  }
}

export function assertProducts(input: unknown): asserts input is Product[] {
  if (!Array.isArray(input)) {
    throw new Error("입력이 배열이 아닙니다.");
  }
  input.forEach((item, index) => assertProduct(item, index));
}
