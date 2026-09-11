import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';
import { planChecks } from './policy.mjs';

const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
const eventName = process.env.GITHUB_EVENT_NAME;
let files = [];
if (eventName === 'pull_request') {
  const base = event.pull_request.base.sha;
  const head = event.pull_request.head.sha;
  if (![base, head].every((sha) => /^[a-f0-9]{40}$/.test(sha))) throw new Error('Invalid PR commit SHA');
  // Include deletions and both sides of renames. Git errors must fail the job.
  files = execFileSync('git', ['diff', '--name-only', '--no-renames', '-z', `${base}...${head}`, '--'], {
    encoding: 'utf8', maxBuffer: 16 * 1024 * 1024,
  }).split('\0').filter(Boolean);
}
const force = event.pull_request?.labels?.some(({ name }) => name === 'run-e2e') ?? false;
const plan = planChecks(eventName, files, force);
appendFileSync(process.env.GITHUB_OUTPUT, `e2e=${plan.e2e}\nreason=${plan.reason}\n`);
console.log(`${plan.reason}; E2E=${plan.e2e}; changed files=${files.length}`);
