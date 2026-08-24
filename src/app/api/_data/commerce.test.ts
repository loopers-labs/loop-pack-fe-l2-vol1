import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { homeBanner, products } from "./commerce";

const productImagesDirectory = join(process.cwd(), "public/images/products");
const imageManifestPath = join(
  process.cwd(),
  "docs/assets/week-05-product-images.md",
);

describe("상품 fixture", () => {
  it("서로 다른 상품 브랜드를 세 개 이상 제공한다", () => {
    expect(new Set(products.map((product) => product.brand)).size).toBeGreaterThanOrEqual(3);
  });

  it("브랜드가 없는 상품에는 중립적인 로컬 브랜드를 사용한다", () => {
    expect(products.find((product) => product.id === "p1")?.brand).toBe(
      "Loopers Select",
    );
  });

  it("할인 상품의 정가를 고정하고 일반가 상품도 유지한다", () => {
    const discountedProducts = products.filter(
      (product) => product.originalPrice !== null,
    );

    expect(products.some((product) => product.originalPrice === null)).toBe(true);
    expect(
      Object.fromEntries(
        discountedProducts.map((product) => [product.id, product.originalPrice]),
      ),
    ).toEqual({
      p4: 158000,
      p7: 498000,
      p10: 109000,
      p11: 58000,
      p16: 89000,
      p18: 279000,
      p21: 29000,
      p23: 49900,
      p27: 499000,
      p30: 7900,
    });
    discountedProducts.forEach((product) => {
      expect(product.originalPrice).toBeGreaterThan(product.price);
    });
  });

  it("상품별로 지정한 이름과 사이즈 및 배송 정보를 유지한다", () => {
    const productsWithSizes = products.filter((product) => product.sizes.length > 0);

    expect(productsWithSizes.map((product) => product.id)).toEqual(["p1"]);
    expect(productsWithSizes[0]).toMatchObject({
      name: "[11월 20일 예약배송] Winter Rocky Pants 2color 윈터 로키팬츠 OG",
      price: 79000,
      sizes: [
        { value: 24, stock: 3 },
        { value: 25, stock: 0 },
        { value: 26, stock: 12 },
        { value: 27, stock: 5 },
        { value: 28, stock: 0 },
      ],
    });
    expect(products.find((product) => product.id === "p2")).toMatchObject({
      freeShipping: false,
      sizes: [],
    });
    expect(products.find((product) => product.id === "p4")?.name).toBe(
      "[Exclusive] PLAIN COTTON CASHMERE CARDIGAN (5 COLORS)",
    );
  });

  it("홈 배너는 p6 상품 이미지를 사용한다", () => {
    expect(homeBanner.image).toBe("/images/products/p6.jpg");
  });

  it("상품 이미지 30개는 비어 있지 않은 서로 다른 JPEG 파일이다", () => {
    const hashes = Array.from({ length: 30 }, (_, index) => {
      const imagePath = join(productImagesDirectory, `p${index + 1}.jpg`);

      expect(existsSync(imagePath)).toBe(true);
      const image = readFileSync(imagePath);
      expect(image.length).toBeGreaterThan(0);
      expect([...image.subarray(0, 3)]).toEqual([0xff, 0xd8, 0xff]);
      return createHash("sha256").update(image).digest("hex");
    });

    expect(new Set(hashes).size).toBe(30);
  });

  it("로컬 이미지 출처 문서를 public 디렉터리 밖에 기록한다", () => {
    expect(existsSync(join(productImagesDirectory, "SOURCES.md"))).toBe(false);
    expect(existsSync(imageManifestPath)).toBe(true);

    if (!existsSync(imageManifestPath)) {
      return;
    }

    const manifest = readFileSync(imageManifestPath, "utf8");
    const imageRows = manifest
      .split("\n")
      .filter((line) => /^\| p\d+ \|/.test(line));
    const p1Row = imageRows.find((line) => line.startsWith("| p1 |"));

    expect(imageRows).toHaveLength(30);
    expect(manifest).not.toMatch(/29\s*cm/i);
    expect(manifest).not.toContain("http");
    expect(p1Row).toContain("| `p1.jpg` |");
    expect(p1Row).toContain(
      "| [11월 20일 예약배송] Winter Rocky Pants 2color 윈터 로키팬츠 OG |",
    );
  });
});
