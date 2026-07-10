# Product semantics final-review fix report

## Result

- Status: `DONE`
- Commit message: `fix: 상품 정보와 이미지 의미를 일치`
- Scope: product fixture identity, category contract, provenance documentation, and static Week 05 examples

## Root cause

The local p1-p30 images were selected from two reference fixtures, but the API seeds retained unrelated invented brands, names, prices, discounts, and category meanings. The image paths were technically local and unique while the product records described different products. This broke the approved semantic contract between each source record, checked-in photo, API payload, and visible example label.

## TDD RED evidence

The route contract was changed before production data and types. It asserted:

- exact p1/p2 source identity while preserving their Week 04 shipping and size overrides;
- exact p1, p6, p11, p16, and p21 names, categories, and prices;
- the five allowed category IDs and labels;
- shared `29CM 셀렉트` brand and `originalPrice: null` for all 30 products;
- rejection of removed `food` and `beauty` category IDs;
- source-name search behavior.

Command:

```text
pnpm exec vitest run src/app/api/products/route.test.ts
```

Observed RED result:

```text
Test Files  1 failed (1)
Tests       6 failed | 14 passed (20)
```

The failures showed the old `food`/`beauty` categories, unrelated product names and prices, missing shared brand, invalid `casual` rejection, and continued acceptance of removed IDs.

## GREEN implementation

- Updated p1-p30 seeds to the exact names and prices of the source record already mapped in `public/images/products/SOURCES.md`.
- Set every brand to the honest fixture-level label `29CM 셀렉트` and every `originalPrice` to `null` because neither fixture contains those values.
- Preserved IDs, ratings, review counts, created timestamps, image paths, response shape, endpoint behavior, and the explicit p1/p2 `freeShipping` and `sizes` overrides.
- Replaced the category contract with `casual`, `fashion`, `goods`, `home`, and `digital`, with six products in each group.
- Updated price-sort expectations to p29/3,000 ascending and p7/428,000 descending.
- Added the exact source product-name column to all 30 provenance rows.
- Updated assignment guidance and the approved design specification to distinguish field-shape/ID compatibility from intentional Week 05 identity and image value changes.
- Replaced both static examples' native image elements with `next/image` using local paths and explicit 400x400 dimensions. Their visible names and alt text now exactly identify p1, p6, p11, and p16. No route, state, or data fetching was added.

Focused GREEN:

```text
pnpm exec vitest run src/app/api/products/route.test.ts
Test Files  1 passed (1)
Tests       20 passed (20)
```

## Verification evidence

| Check | Result |
| --- | --- |
| `pnpm test` | PASS: 23/23 tests across 2 files |
| `pnpm exec tsc --noEmit` | PASS |
| `pnpm lint` | PASS: zero errors and zero warnings |
| `pnpm build` | PASS: compiled, typechecked, generated 6/6 static pages |
| `git diff --check` | PASS |
| stale semantic string scan | PASS: no old category IDs/labels or p1/p2/p6/p11/p16 invented names in current source/docs |
| 30-row source/provenance audit | PASS: source names/prices, seed identities/categories, provenance rows, and non-empty image files all match |

The first sandboxed build attempt failed only because Google Fonts could not be fetched. The same unchanged build command was rerun with network permission and passed.

## Runtime URL audit

A production server from the successful build was started at `127.0.0.1:4317` and audited directly:

- `GET /api/products?pageSize=24`: HTTP 200; source identity fields, new category list, local image paths, null original prices, and existing response shape observed.
- `GET /api/products?category=casual&pageSize=24`: HTTP 200; exactly p1-p5 and p26, `totalCount: 6`.
- `GET /images/products/p1.jpg`: HTTP 200, `image/jpeg`.
- `GET /images/products/p30.jpg`: HTTP 200, `image/jpeg`.

The audit server was stopped after verification.

## Source/provenance cross-check

A temporary, uncommitted Node audit read both original fixtures, all 30 `SOURCES.md` rows, all 30 API seeds, and all 30 checked-in image files. It verified exact name and price equality, the shared brand, null original prices, the six-item category distribution, documented source names, and non-empty local files.

Observed result:

```text
PASS: 30 source names/prices, seed identities/categories, provenance rows, and non-empty images match
```

The temporary audit helper was deleted and no scripts or dependencies were added.

## Concerns

None in the requested scope. The existing third-party thumbnail redistribution/licensing caveat remains a repository-owner responsibility and is unchanged by this semantic correction.
