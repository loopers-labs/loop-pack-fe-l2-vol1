import test from 'node:test'
import assert from 'node:assert/strict'
import { collectModuleSpecifiers, validateImport } from './lib.mjs'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

const publicApis = [
  'src/_pages/home',
  'src/_pages/product-list',
  'src/widgets/header',
]

test('multiline, type, dynamic imports를 수집한다', () => {
  const source = `
    import type { Product } from '@/entities/product/model/product'
    export { HomePage } from './ui/HomePage'
    const lazy = import('@/widgets/header')
  `
  assert.deepEqual(
    collectModuleSpecifiers(source, 'fixture.ts').map(
      ({ specifier }) => specifier,
    ),
    ['@/entities/product/model/product', './ui/HomePage', '@/widgets/header'],
  )
})

test('하위 레이어의 상위 참조를 거부한다', () => {
  const findings = validateImport({
    importer: 'src/entities/product/model/product.ts',
    specifier: '@/widgets/product-grid/ui/ProductGrid',
    publicApis,
  })
  assert.equal(findings[0].rule, 'fsd/lower-to-higher')
})

test('같은 레이어의 다른 슬라이스 참조를 거부한다', () => {
  const findings = validateImport({
    importer: 'src/entities/cart/model/cart.ts',
    specifier: '@/entities/wishlist/model/wishlist',
    publicApis,
  })
  assert.ok(findings.some(({ rule }) => rule === 'fsd/cross-slice'))
})

test('외부 deep import는 거부하고 같은 슬라이스 내부 협력은 허용한다', () => {
  const outside = validateImport({
    importer: 'src/app/layout.tsx',
    specifier: '@/widgets/header/ui/HeaderCounts',
    publicApis,
  })
  const inside = validateImport({
    importer: 'src/_pages/product-list/ui/ProductListView.tsx',
    specifier: '@/_pages/product-list/api/productList',
    publicApis,
  })
  assert.ok(outside.some(({ rule }) => rule === 'public-api/deep-import'))
  assert.deepEqual(inside, [])
})

test('staged 검사는 working tree가 아니라 Git index 내용을 읽는다', () => {
  const fixture = mkdtempSync(path.join(tmpdir(), 'architecture-review-'))
  mkdirSync(path.join(fixture, 'src/entities/product/model'), {
    recursive: true,
  })
  mkdirSync(path.join(fixture, 'src/widgets/grid/ui'), { recursive: true })
  writeFileSync(
    path.join(fixture, 'architecture.config.json'),
    JSON.stringify({ publicApis: [], documentGuards: [], manualReview: [] }),
  )
  writeFileSync(
    path.join(fixture, 'src/entities/product/model/product.ts'),
    "import Grid from '@/widgets/grid/ui/Grid'\nexport default Grid\n",
  )
  writeFileSync(
    path.join(fixture, 'src/widgets/grid/ui/Grid.ts'),
    'export default function Grid() {}\n',
  )
  execFileSync('git', ['init', '-q'], { cwd: fixture })
  execFileSync('git', ['add', '.'], { cwd: fixture })

  // Index에는 역방향 import가 남아 있지만 working tree에서만 고친다.
  writeFileSync(
    path.join(fixture, 'src/entities/product/model/product.ts'),
    'export const product = {}\n',
  )

  assert.throws(
    () =>
      execFileSync(
        process.execPath,
        [path.resolve('scripts/architecture/review.mjs'), '--staged'],
        { cwd: fixture, encoding: 'utf8', stdio: 'pipe' },
      ),
    (error) =>
      error.stderr.includes('fsd/lower-to-higher') &&
      error.stderr.includes('src/entities/product/model/product.ts:1'),
  )
})

test('설정에 빠진 슬라이스 루트 index.ts를 거부한다', () => {
  const fixture = mkdtempSync(path.join(tmpdir(), 'architecture-review-'))
  mkdirSync(path.join(fixture, 'src/widgets/header'), { recursive: true })
  writeFileSync(
    path.join(fixture, 'architecture.config.json'),
    JSON.stringify({ publicApis: [], documentGuards: [], manualReview: [] }),
  )
  writeFileSync(
    path.join(fixture, 'src/widgets/header/index.ts'),
    "export { Header } from './ui/Header'\n",
  )
  execFileSync('git', ['init', '-q'], { cwd: fixture })
  execFileSync('git', ['add', '.'], { cwd: fixture })

  assert.throws(
    () =>
      execFileSync(
        process.execPath,
        [path.resolve('scripts/architecture/review.mjs'), '--staged'],
        { cwd: fixture, encoding: 'utf8', stdio: 'pipe' },
      ),
    (error) => error.stderr.includes('public-api/unconfigured'),
  )
})
