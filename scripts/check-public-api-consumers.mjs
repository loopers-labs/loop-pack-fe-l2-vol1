import { readFile, readdir } from 'node:fs/promises'
import { existsSync, statSync } from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

/*
 * entities 슬라이스의 Public API가 실제 외부 소비처를 갖는지 검사한다.
 * 내부 파일에서만 쓰이는 export를 공개하면 계약 표면과 유지 비용이 불필요하게 커진다.
 * TypeScript AST로 export와 import를 대조해 grep의 문자열 오탐을 피한다.
 */
const ROOT = process.cwd()
const SRC_DIR = path.join(ROOT, 'src')
const APP_DIR = path.join(ROOT, 'app')
const ENTITIES_DIR = path.join(SRC_DIR, 'entities')
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.mts'])

const walk = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = await Promise.all(
    entries.map((entry) => {
      const target = path.join(directory, entry.name)
      return entry.isDirectory() ? walk(target) : target
    }),
  )

  return files.flat().filter((file) => SOURCE_EXTENSIONS.has(path.extname(file)))
}

const getExportedNames = (file, source) => {
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true)
  const names = new Set()

  for (const statement of ast.statements) {
    if (ts.isExportDeclaration(statement)) {
      if (!statement.exportClause) {
        throw new Error(
          `${path.relative(ROOT, file)}: export *은 명시적인 named export로 바꿔야 합니다.`,
        )
      }

      if (ts.isNamedExports(statement.exportClause)) {
        for (const element of statement.exportClause.elements) {
          names.add(element.name.text)
        }
      }
      continue
    }

    if (!statement.modifiers?.some(({ kind }) => kind === ts.SyntaxKind.ExportKeyword)) continue
    if (ts.isExportAssignment(statement)) continue

    if ('name' in statement && statement.name && ts.isIdentifier(statement.name)) {
      names.add(statement.name.text)
      continue
    }

    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) names.add(declaration.name.text)
      }
    }
  }

  return names
}

const resolveModule = (importer, specifier) => {
  const base = specifier.startsWith('@/')
    ? path.join(SRC_DIR, specifier.slice(2))
    : specifier.startsWith('.')
      ? path.resolve(path.dirname(importer), specifier)
      : null

  if (!base) return null

  const candidates = [
    base,
    ...[...SOURCE_EXTENSIONS].map((extension) => `${base}${extension}`),
    ...[...SOURCE_EXTENSIONS].map((extension) => path.join(base, `index${extension}`)),
  ]
  return (
    candidates.find((candidate) => existsSync(candidate) && statSync(candidate).isFile()) ?? null
  )
}

const inspectConsumers = (api, files, exportedNames) => {
  const consumedNames = new Set()

  for (const file of files) {
    const source = ts.createSourceFile(
      file,
      requireSource(file),
      ts.ScriptTarget.Latest,
      true,
      file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    )

    for (const statement of source.statements) {
      if (ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier)) {
        if (resolveModule(file, statement.moduleSpecifier.text) !== api) continue
        const clause = statement.importClause
        if (!clause) continue
        if (clause.name) consumedNames.add('default')
        if (clause.namedBindings && ts.isNamespaceImport(clause.namedBindings)) {
          exportedNames.forEach((name) => consumedNames.add(name))
        } else if (clause.namedBindings) {
          for (const element of clause.namedBindings.elements) {
            consumedNames.add((element.propertyName ?? element.name).text)
          }
        }
      }

      if (ts.isExportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier)) {
        if (resolveModule(file, statement.moduleSpecifier.text) !== api) continue
        if (statement.exportClause && ts.isNamedExports(statement.exportClause)) {
          for (const element of statement.exportClause.elements) {
            consumedNames.add((element.propertyName ?? element.name).text)
          }
        } else {
          exportedNames.forEach((name) => consumedNames.add(name))
        }
      }
    }
  }

  return consumedNames
}

const sourceCache = new Map()
const requireSource = (file) => {
  if (!sourceCache.has(file)) throw new Error(`sourceCache 누락: ${file}`)
  return sourceCache.get(file)
}

const main = async () => {
  const files = (await Promise.all([SRC_DIR, APP_DIR].map(walk))).flat()
  const entityEntries = (await readdir(ENTITIES_DIR, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(ENTITIES_DIR, entry.name, 'index.ts'))

  for (const file of files) sourceCache.set(file, await readFile(file, 'utf8'))

  const failures = []
  for (const api of entityEntries) {
    if (!sourceCache.has(api)) continue
    const exportedNames = getExportedNames(api, sourceCache.get(api))
    const consumedNames = inspectConsumers(api, files, exportedNames)
    for (const name of exportedNames) {
      if (!consumedNames.has(name)) failures.push(`${path.relative(ROOT, api)}: ${name}`)
    }
  }

  if (failures.length > 0) {
    console.error('Public API 외부 소비처가 없는 export입니다.')
    failures.forEach((failure) => console.error(`- ${failure}`))
    process.exitCode = 1
    return
  }

  console.log(`Public API 소비처 검사 통과 (${entityEntries.length}개 슬라이스)`)
}

await main()
