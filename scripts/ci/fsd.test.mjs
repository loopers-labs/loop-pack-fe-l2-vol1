import assert from 'node:assert/strict';
import test from 'node:test';
import { ESLint } from 'eslint';

test('the real ESLint configuration blocks upward imports and permits downward imports', async () => {
  const eslint = new ESLint({ overrideConfigFile: 'eslint.config.mjs' });
  // lintText checks synthetic content without changing the source files.
  const [violation] = await eslint.lintText("import '@/app/api/_data/orderRepository';\n", {
    filePath: 'src/entities/product/model/types.ts',
  });
  assert.ok(violation.messages.some(({ ruleId }) => ruleId === 'import/no-restricted-paths'));
  const [normal] = await eslint.lintText("import '@/entities/product/model/types';\n", {
    filePath: 'src/app/api/_data/orderRepository.ts',
  });
  assert.equal(normal.errorCount, 0, JSON.stringify(normal.messages));
});
