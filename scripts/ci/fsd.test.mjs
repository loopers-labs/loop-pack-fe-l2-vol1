import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import test from 'node:test';
import { ESLint } from 'eslint';

test('the real ESLint configuration blocks upward imports and permits downward imports', async () => {
  const repositoryRoot = resolve(import.meta.dirname, '../..');
  const entityFile = resolve(repositoryRoot, 'src/entities/product/model/types.ts');
  const appFile = resolve(repositoryRoot, 'src/app/api/_data/orderRepository.ts');
  const eslint = new ESLint({ overrideConfigFile: 'eslint.config.mjs' });
  const entityConfig = await eslint.calculateConfigForFile(entityFile);
  assert.equal(
    entityConfig?.rules['no-restricted-imports']?.[0],
    2,
    JSON.stringify(entityConfig?.rules['no-restricted-imports']),
  );

  const [aliasViolation] = await eslint.lintText(
    "import { orderRepository } from '@/app/api/_data/orderRepository';\nvoid orderRepository;\n",
    { filePath: entityFile, warnIgnored: true },
  );
  assert.ok(
    aliasViolation.messages.some(({ ruleId }) => ruleId === 'no-restricted-imports'),
    JSON.stringify(aliasViolation.messages),
  );

  const [relativeViolation] = await eslint.lintText(
    "import { orderRepository } from '../../../app/api/_data/orderRepository';\nvoid orderRepository;\n",
    { filePath: entityFile, warnIgnored: true },
  );
  assert.ok(
    relativeViolation.messages.some(({ ruleId }) => ruleId === 'import/no-restricted-paths'),
    JSON.stringify(relativeViolation.messages),
  );

  const [normal] = await eslint.lintText(
    "import type { Product } from '@/entities/product/model/types';\nvoid (undefined as Product | undefined);\n",
    { filePath: appFile, warnIgnored: true },
  );
  assert.equal(normal.errorCount, 0, JSON.stringify(normal.messages));
});
