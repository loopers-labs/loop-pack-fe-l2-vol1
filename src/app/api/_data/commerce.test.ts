import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { homeBanner, products } from "./commerce";

const productImagesDirectory = join(process.cwd(), "public/images/products");
const assetManifestPath = join(
  process.cwd(),
  "docs/assets/week-05-product-assets.md",
);

describe("commerce fixture", () => {
  it("uses at least three explicit product brands", () => {
    expect(new Set(products.map((product) => product.brand)).size).toBeGreaterThanOrEqual(3);
  });

  it("uses a neutral local brand for products without an explicit brand", () => {
    expect(products.find((product) => product.id === "p1")?.brand).toBe(
      "Loopers Select",
    );
  });

  it("provides deterministic mock discounts while retaining full-price products", () => {
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

  it("matches p1 to the pants source and gives numeric sizes only to p1", () => {
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

  it("uses p6 for the home banner image", () => {
    expect(homeBanner.image).toBe("/images/products/product-06.svg");
  });

  it("keeps all 30 product illustrations non-empty, unique local SVG files", () => {
    const hashes = Array.from({ length: 30 }, (_, index) => {
      const fileName = `product-${String(index + 1).padStart(2, "0")}.svg`;
      const imagePath = join(productImagesDirectory, fileName);

      expect(existsSync(imagePath)).toBe(true);
      const image = readFileSync(imagePath, "utf8");
      expect(image.length).toBeGreaterThan(0);
      expect(image).toContain("<svg");
      expect(image).not.toMatch(/(?:href|src)=["']https?:/);
      return createHash("sha256").update(image).digest("hex");
    });

    expect(new Set(hashes).size).toBe(30);
  });

  it("records the local asset manifest outside public assets", () => {
    expect(existsSync(join(productImagesDirectory, "SOURCES.md"))).toBe(false);
    expect(existsSync(assetManifestPath)).toBe(true);

    if (!existsSync(assetManifestPath)) {
      return;
    }

    const manifest = readFileSync(assetManifestPath, "utf8");
    const assetRows = manifest
      .split("\n")
      .filter((line) => /^\| p\d+ \|/.test(line));
    const p1Row = assetRows.find((line) => line.startsWith("| p1 |"));

    expect(assetRows).toHaveLength(30);
    expect(manifest).not.toContain("http");
    expect(p1Row).toContain("| `product-01.svg` |");
    expect(p1Row).toContain("| casual |");
  });
});
