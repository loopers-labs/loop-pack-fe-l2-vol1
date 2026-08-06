import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = process.cwd();
const sourceRoot = path.join(projectRoot, "src");

const layerOrder = {
  app: 0,
  _app: 0,
  _pages: 1,
  widgets: 2,
  features: 3,
  entities: 4,
  shared: 5,
} as const;

type LayerName = keyof typeof layerOrder;

type SourceModule = {
  filePath: string;
  imports: string[];
};

type FsdModule = {
  layer: LayerName;
  slice: string | null;
};

const sourceExtensions = [".ts", ".tsx"] as const;
const importPattern =
  /(?:import|export)\s+(?:type\s+)?(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/g;

describe("FSD import boundary", () => {
  it("하위 레이어가 상위 레이어를 import하지 않는다", () => {
    const violations = getSourceModules().flatMap((sourceModule) => {
      const sourceFsdModule = getFsdModule(sourceModule.filePath);

      if (sourceFsdModule === null) {
        return [];
      }

      return sourceModule.imports.flatMap((importPath) => {
        const targetFilePath = resolveInternalImport(sourceModule.filePath, importPath);

        if (targetFilePath === null) {
          return [];
        }

        const targetFsdModule = getFsdModule(targetFilePath);

        if (targetFsdModule === null) {
          return [];
        }

        if (layerOrder[targetFsdModule.layer] >= layerOrder[sourceFsdModule.layer]) {
          return [];
        }

        return [
          `${formatSourcePath(sourceModule.filePath)} -> ${formatSourcePath(targetFilePath)}`,
        ];
      });
    });

    expect(violations).toEqual([]);
  });

  it("같은 레이어의 다른 slice를 직접 import하지 않는다", () => {
    const violations = getSourceModules().flatMap((sourceModule) => {
      const sourceFsdModule = getFsdModule(sourceModule.filePath);

      if (sourceFsdModule === null || !hasSliceBoundary(sourceFsdModule)) {
        return [];
      }

      return sourceModule.imports.flatMap((importPath) => {
        const targetFilePath = resolveInternalImport(sourceModule.filePath, importPath);

        if (targetFilePath === null) {
          return [];
        }

        const targetFsdModule = getFsdModule(targetFilePath);

        if (targetFsdModule === null || !hasSliceBoundary(targetFsdModule)) {
          return [];
        }

        if (
          sourceFsdModule.layer !== targetFsdModule.layer ||
          sourceFsdModule.slice === targetFsdModule.slice
        ) {
          return [];
        }

        return [
          `${formatSourcePath(sourceModule.filePath)} -> ${formatSourcePath(targetFilePath)}`,
        ];
      });
    });

    expect(violations).toEqual([]);
  });
});

function getSourceModules(): SourceModule[] {
  return getSourceFiles(sourceRoot)
    .filter((filePath) => !isExcludedSourceFile(filePath))
    .map((filePath) => ({
      filePath,
      imports: getImportPaths(filePath),
    }));
}

function getSourceFiles(directoryPath: string): string[] {
  return readdirSync(directoryPath).flatMap((entryName) => {
    const entryPath = path.join(directoryPath, entryName);
    const entryStat = statSync(entryPath);

    if (entryStat.isDirectory()) {
      return getSourceFiles(entryPath);
    }

    if (sourceExtensions.some((extension) => entryPath.endsWith(extension))) {
      return [entryPath];
    }

    return [];
  });
}

function isExcludedSourceFile(filePath: string) {
  const sourcePath = formatSourcePath(filePath);

  return sourcePath.startsWith("src/app/api/");
}

function getImportPaths(filePath: string) {
  const code = readFileSync(filePath, "utf8");
  const importPaths: string[] = [];

  for (const match of code.matchAll(importPattern)) {
    const importPath = match[1] ?? match[2];

    if (importPath !== undefined) {
      importPaths.push(importPath);
    }
  }

  return importPaths;
}

function resolveInternalImport(importerPath: string, importPath: string) {
  if (importPath.startsWith("@/")) {
    return resolveSourcePath(importPath.replace("@/", ""));
  }

  if (importPath.startsWith(".")) {
    const importerDirectory = path.dirname(importerPath);
    return resolveFilePath(path.resolve(importerDirectory, importPath));
  }

  return null;
}

function resolveSourcePath(sourcePath: string) {
  return resolveFilePath(path.join(sourceRoot, sourcePath));
}

function resolveFilePath(filePathWithoutExtension: string) {
  if (
    isSourceFilePath(filePathWithoutExtension) &&
    existsSync(filePathWithoutExtension) &&
    statSync(filePathWithoutExtension).isFile()
  ) {
    return filePathWithoutExtension;
  }

  for (const extension of sourceExtensions) {
    const filePath = `${filePathWithoutExtension}${extension}`;

    if (existsSync(filePath)) {
      return filePath;
    }
  }

  for (const extension of sourceExtensions) {
    const filePath = path.join(filePathWithoutExtension, `index${extension}`);

    if (existsSync(filePath)) {
      return filePath;
    }
  }

  return null;
}

function isSourceFilePath(filePath: string) {
  return sourceExtensions.some((extension) => filePath.endsWith(extension));
}

function getFsdModule(filePath: string): FsdModule | null {
  const [rootSegment, layer] = path.relative(sourceRoot, filePath).split(path.sep);

  if (rootSegment === "app") {
    return { layer: "app", slice: null };
  }

  if (!isLayerName(rootSegment)) {
    return null;
  }

  return {
    layer: rootSegment,
    slice: rootSegment === "_app" || rootSegment === "shared" ? null : (layer ?? null),
  };
}

function isLayerName(segment: string): segment is LayerName {
  return segment in layerOrder;
}

function hasSliceBoundary(fsdModule: FsdModule) {
  return fsdModule.slice !== null;
}

function formatSourcePath(filePath: string) {
  return path.relative(projectRoot, filePath);
}
