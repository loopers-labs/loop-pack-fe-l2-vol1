import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { homeBanner, products } from "./commerce";

const productImagesDirectory = join(process.cwd(), "public/images/products");
const provenancePath = join(
  process.cwd(),
  "docs/assets/week-05-product-images.md",
);

describe("commerce fixture", () => {
  it("uses at least three explicit product brands", () => {
    expect(new Set(products.map((product) => product.brand)).size).toBeGreaterThanOrEqual(3);
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
  });

  it("uses p6 for the home banner image", () => {
    expect(homeBanner.image).toBe("/images/products/p6.jpg");
  });

  it("keeps all 30 product images non-empty, unique JPEG files", () => {
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

  it("records pinned source provenance outside public assets", () => {
    expect(existsSync(join(productImagesDirectory, "SOURCES.md"))).toBe(false);
    expect(existsSync(provenancePath)).toBe(true);

    if (!existsSync(provenancePath)) {
      return;
    }

    const provenance = readFileSync(provenancePath, "utf8");
    const sourceRows = provenance
      .split("\n")
      .filter((line) => /^\| p\d+ \|/.test(line));
    const p1Row = sourceRows.find((line) => line.startsWith("| p1 |"));

    expect(sourceRows).toHaveLength(30);
    expect(provenance).toContain("2026-07-10");
    expect(provenance).toContain("e17b28f3085719bb00608e42d54cee96484afea6");
    expect(provenance).toContain("19832723bdbe9780cc40f47f30def3fcaf1c8be4");
    expect(provenance).toContain(
      "Attribution does not grant redistribution rights. Confirm permission with the rights holder before public release.",
    );
    expect(p1Row).toContain("| 1340400 |");
    expect(p1Row).toContain(
      "| [11월 20일 예약배송] Winter Rocky Pants 2color 윈터 로키팬츠 OG |",
    );
    expect(p1Row).toContain(
      "https://img.29cm.co.kr/next-product/2021/12/08/a1c959f9fb2d47098eca6015446efe48_20211208183740.jpg?width=400",
    );
  });
});
