import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import test from 'node:test';
import { ESLint } from 'eslint';

test('the real ESLint configuration blocks upward imports and permits downward imports', async () => {
  const eslint = new ESLint({ overrideConfigFile: 'eslint.config.mjs' });
  const repositoryRoot = resolve(import.meta.dirname, '../..');
  const entityFile = resolve(repositoryRoot, 'src/entities/product/model/types.ts');
  const appFile = resolve(repositoryRoot, 'src/app/api/_data/orderRepository.ts');
  // lintText checks synthetic content without changing the source files.
  const [aliasViolation] = await eslint.lintText("import '@/app/api/_data/orderRepository';\n", {
    filePath: entityFile,
  });
  assert.ok(
    aliasViolation.messages.some(({ ruleId }) => ruleId === 'no-restricted-imports'),
    JSON.stringify(aliasViolation.messages),
  );
  const [relativeViolation] = await eslint.lintText(
    "import '../../../app/api/_data/orderRepository';\n",
    { filePath: entityFile },
  );
  assert.ok(
    relativeViolation.messages.some(({ ruleId }) => ruleId === 'import/no-restricted-paths'),
    JSON.stringify(relativeViolation.messages),
  );
  const [normal] = await eslint.lintText("import '@/entities/product/model/types';\n", {
    filePath: appFile,
  });
  assert.equal(normal.errorCount, 0, JSON.stringify(normal.messages));
});
