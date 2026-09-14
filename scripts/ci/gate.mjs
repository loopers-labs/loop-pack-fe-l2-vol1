import { appendFileSync } from 'node:fs';
import { checkOutcomes } from './policy.mjs';

const steps = JSON.parse(process.env.CI_STEPS);
const failures = checkOutcomes(steps, process.env.E2E_REQUIRED);
const rows = Object.entries(steps).map(([id, step]) => `| ${id} | ${step.outcome} |`);
appendFileSync(process.env.GITHUB_STEP_SUMMARY, [
  '## Quality results', '',
  `Commit: ${process.env.GITHUB_SHA}`, '',
  `E2E required: ${process.env.E2E_REQUIRED ?? 'missing'}`, '',
  `E2E reason: ${process.env.E2E_REASON || 'missing'}`, '',
  `Cache hit: ${process.env.CACHE_HIT || 'not reported (inspect setup log)'}`, '',
  'Individual step durations are available in the Actions job timeline.', '',
  '| Step | Outcome |', '| --- | --- |', ...rows, '',
  failures.length ? `Gate failed:\n${failures.map((failure) => `- ${failure}`).join('\n')}` : 'All required checks passed.', '',
].join('\n'));
for (const failure of failures) console.error(failure);
process.exitCode = failures.length ? 1 : 0;
