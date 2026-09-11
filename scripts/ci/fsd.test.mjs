import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { ESLint } from 'eslint';

test('the real ESLint configuration blocks upward imports and permits downward imports', async () => {
  const repositoryRoot = resolve(import.meta.dirname, '../..');
  const fixtureRoot = resolve(repositoryRoot, 'src/entities');
  const fixtureDirectory = await mkdtemp(resolve(fixtureRoot, 'ci-fsd-'));
  assert.equal(dirname(fixtureDirectory), fixtureRoot);
  const aliasFile = resolve(fixtureDirectory, 'alias-violation.ts');
  const relativeFile = resolve(fixtureDirectory, 'relative-violation.ts');
  const normalFile = resolve(fixtureDirectory, 'normal.ts');

  try {
    await Promise.all([
      writeFile(
        aliasFile,
        "import { orderRepository } from '@/app/api/_data/orderRepository';\nvoid orderRepository;\n",
      ),
      writeFile(
        relativeFile,
        "import { orderRepository } from '../../app/api/_data/orderRepository';\nvoid orderRepository;\n",
      ),
      writeFile(normalFile, "import { formatWon } from '@/shared/lib/format';\nvoid formatWon;\n"),
    ]);

    const eslint = new ESLint({ overrideConfigFile: 'eslint.config.mjs' });
    const results = await eslint.lintFiles([aliasFile, relativeFile, normalFile]);
    const resultFor = (filePath) => results.find((result) => result.filePath === filePath);
    const aliasViolation = resultFor(aliasFile);
    const relativeViolation = resultFor(relativeFile);
    const normal = resultFor(normalFile);

    assert.ok(
      aliasViolation?.messages.some(({ ruleId }) => ruleId === 'no-restricted-imports'),
      JSON.stringify(aliasViolation?.messages),
    );
    assert.ok(
      relativeViolation?.messages.some(({ ruleId }) => ruleId === 'import/no-restricted-paths'),
      JSON.stringify(relativeViolation?.messages),
    );
    assert.equal(normal?.errorCount, 0, JSON.stringify(normal?.messages));
  } finally {
    await rm(fixtureDirectory, { recursive: true, force: true });
  }
});
