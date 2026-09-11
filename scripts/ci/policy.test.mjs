import assert from 'node:assert/strict';
import test from 'node:test';
import { checkOutcomes, planChecks } from './policy.mjs';

test('only allowlisted docs skip E2E, including draft PRs with app changes', () => {
  assert.equal(planChecks('pull_request', ['README.md', 'docs/rfc/week10-ci.md']).e2e, false);
  for (const files of [[], ['src/help.md'], ['pnpm-workspace.yaml'], ['.github/workflows/quality.yml'],
    ['docs/data.json'], ['docs/../src/page.md'], ['docs/./guide.md'], ['docs//guide.md'],
    ['docs\\guide.md'], ['Docs/guide.md'], ['docs/guide.MD'], ['docs/guide.md\0src/app/page.tsx'],
    ['README.md', 'src/app/page.tsx']]) {
    assert.equal(planChecks('pull_request', files).e2e, true);
  }
});

test('merge group, push, manual execution and explicit label always run E2E', () => {
  for (const event of ['merge_group', 'push', 'workflow_dispatch']) {
    assert.equal(planChecks(event, ['README.md']).e2e, true);
  }
  assert.equal(planChecks('pull_request', ['README.md'], true).e2e, true);
});

const outcomes = (e2e) => Object.fromEntries(
  ['plan', 'install', 'ci_tests', 'environment', 'test', 'lint', 'types', 'build', 'bundle', 'browser_deps', 'browser', 'e2e']
    .map((id) => [id, { outcome: !e2e && ['browser_deps', 'browser', 'e2e'].includes(id) ? 'skipped' : 'success' }]),
);

test('gate accepts successful full runs and authorized documentation skips', () => {
  assert.deepEqual(checkOutcomes(outcomes(true), 'true'), []);
  assert.deepEqual(checkOutcomes(outcomes(false), 'false'), []);
});

test('gate rejects failed, cancelled, skipped or missing required checks', () => {
  for (const id of Object.keys(outcomes(true))) {
    for (const outcome of ['failure', 'cancelled', 'skipped', undefined]) {
      const steps = outcomes(true);
      steps[id] = { outcome };
      assert.ok(checkOutcomes(steps, 'true').length > 0, `${id}: ${outcome}`);
    }
  }
  assert.ok(checkOutcomes(outcomes(true), '').length > 0);
  assert.ok(checkOutcomes(outcomes(false), 'true').length > 0);
  assert.ok(checkOutcomes(outcomes(true), 'false').length > 0);
});
