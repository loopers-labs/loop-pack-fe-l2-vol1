import path from 'node:path'
import ts from 'typescript'

const layerRanks = new Map([
  ['shared', 0],
  ['entities', 1],
  ['features', 2],
  ['widgets', 3],
  ['_pages', 4],
  ['_app', 5],
  ['app', 5],
])

const slicedLayers = new Set(['entities', 'features', 'widgets', '_pages'])

export const normalizePath = (value) => value.split(path.sep).join('/')

export const architectureUnitOf = (filePath) => {
  const normalized = normalizePath(filePath)
  const parts = normalized.split('/')
  const srcIndex = parts.indexOf('src')
  const layer = parts[srcIndex + 1]

  if (srcIndex < 0 || !layerRanks.has(layer)) return null

  return {
    layer,
    rank: layerRanks.get(layer),
    slice: slicedLayers.has(layer) ? (parts[srcIndex + 2] ?? null) : null,
  }
}

export const collectModuleSpecifiers = (source, fileName = 'source.ts') => {
  const sourceFile = ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true,
    fileName.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  )
  const imports = []

  const visit = (node) => {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      imports.push({
        specifier: node.moduleSpecifier.text,
        line:
          sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1,
      })
    }

    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments.length === 1 &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      imports.push({
        specifier: node.arguments[0].text,
        line:
          sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1,
      })
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return imports
}

export const resolveProjectImport = (importer, specifier) => {
  if (specifier.startsWith('@/')) return `src/${specifier.slice(2)}`
  if (!specifier.startsWith('.')) return null
  return normalizePath(path.join(path.dirname(importer), specifier))
}

export const validateImport = ({ importer, specifier, publicApis }) => {
  const target = resolveProjectImport(importer, specifier)
  if (!target) return []

  const findings = []
  const sourceUnit = architectureUnitOf(importer)
  const targetUnit = architectureUnitOf(target)

  if (sourceUnit && targetUnit && sourceUnit.rank < targetUnit.rank) {
    findings.push({
      rule: 'fsd/lower-to-higher',
      message: `${sourceUnit.layer}가 상위 레이어 ${targetUnit.layer}를 참조합니다.`,
    })
  }

  if (
    sourceUnit &&
    targetUnit &&
    sourceUnit.layer === targetUnit.layer &&
    sourceUnit.slice &&
    targetUnit.slice &&
    sourceUnit.slice !== targetUnit.slice
  ) {
    findings.push({
      rule: 'fsd/cross-slice',
      message: `${sourceUnit.layer}의 ${sourceUnit.slice} 슬라이스가 ${targetUnit.slice} 슬라이스를 직접 참조합니다.`,
    })
  }

  for (const publicApi of publicApis) {
    const root = normalizePath(publicApi)
    const reachesSlice = target === root || target.startsWith(`${root}/`)
    const comesFromOutside =
      importer !== root && !importer.startsWith(`${root}/`)

    if (reachesSlice && comesFromOutside && target !== root) {
      findings.push({
        rule: 'public-api/deep-import',
        message: `${root}의 내부 구현 대신 슬라이스 루트 Public API를 사용해야 합니다.`,
      })
    }
  }

  return findings
}
