import { existsSync, readFileSync } from 'node:fs'
import { dirname, extname, resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const sourceRoot = resolve(process.cwd(), 'src')
const importPattern =
  /(?:import|export)\s+(?:type\s+)?(?:[^'";]+?\s+from\s+)?['"]([^'"]+)['"]/g
const extensions = ['', '.ts', '.tsx'] as const

function resolveSourceImport(importer: string, specifier: string) {
  const basePath = specifier.startsWith('@/')
    ? resolve(sourceRoot, specifier.slice(2))
    : resolve(dirname(importer), specifier)

  for (const extension of extensions) {
    const candidate = `${basePath}${extension}`
    if (existsSync(candidate) && extname(candidate) !== '') {
      return candidate
    }
  }
  return undefined
}

function reachableSourceFiles(entries: ReadonlyArray<string>) {
  const pending = [...entries]
  const visited = new Set<string>()

  while (pending.length > 0) {
    const file = pending.pop()
    if (file === undefined || visited.has(file)) {
      continue
    }
    visited.add(file)
    const source = readFileSync(file, 'utf8')
    for (const match of source.matchAll(importPattern)) {
      const specifier = match[1]
      if (!specifier.startsWith('@/') && !specifier.startsWith('.')) {
        continue
      }
      const dependency = resolveSourceImport(file, specifier)
      if (dependency !== undefined) {
        pending.push(dependency)
      }
    }
  }
  return [...visited]
}

describe('server and client import reachability', () => {
  it('keeps client-marked graphs out of concrete server modules', () => {
    const reachable = reachableSourceFiles([
      resolve(sourceRoot, 'views/home/ui/HomeView.tsx'),
      resolve(sourceRoot, 'views/product-list/ui/ProductListView.tsx'),
    ])

    expect(reachable).not.toEqual(
      expect.arrayContaining([
        expect.stringMatching(/ProductServerRepository\.ts$/),
        expect.stringMatching(/ProductServerService\.ts$/),
        expect.stringMatching(/getAppOrigin\.ts$/),
      ]),
    )
    expect(
      reachable.some((file) =>
        readFileSync(file, 'utf8').includes('server-only'),
      ),
    ).toBe(false)
  })

  it('limits metadata runtime error imports to standalone classes', () => {
    const metadataFiles = [
      resolve(sourceRoot, 'views/home/model/HomeMetadata.ts'),
      resolve(sourceRoot, 'views/product-list/model/ProductListMetadata.ts'),
    ]

    for (const file of metadataFiles) {
      const source = readFileSync(file, 'utf8')
      expect(source).toContain(
        "import { ProductServerFetchError } from '@/entities/product/api/ProductServerFetchError'",
      )
      expect(source).toContain(
        "import { ApiClientError } from '@/shared/api/ApiClientError'",
      )
      expect(source).not.toMatch(/ProductServer(?:Repository|Service)/)
      expect(source).not.toContain('getAppOrigin')
      expect(source).not.toContain('process.env')
    }
  })
})
