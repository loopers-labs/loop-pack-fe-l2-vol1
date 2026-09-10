// Only documentation paths known not to be consumed by the application may skip E2E.
export function planChecks(eventName, files, forceE2e = false) {
  if (eventName !== 'pull_request' || forceE2e) {
    return { e2e: true, reason: 'Full verification requested by event or label' };
  }
  const isDocumentation = (file) => {
    if (typeof file !== 'string' || file.includes('\\') || file.includes('\0')) return false;
    if (['README.md', 'CLAUDE.md', 'AGENTS.md'].includes(file)) return true;
    const segments = file.split('/');
    return segments[0] === 'docs' && segments.length > 1 &&
      segments.every((segment) => segment !== '' && segment !== '.' && segment !== '..') &&
      file.endsWith('.md');
  };
  const docsOnly = files.length > 0 && files.every(isDocumentation);
  return {
    e2e: !docsOnly,
    reason: docsOnly ? 'Only allowlisted Markdown documentation changed' : 'Application, unknown, or empty change set',
  };
}

export function checkOutcomes(steps, e2e) {
  if (e2e !== 'true' && e2e !== 'false') return ['Invalid or missing E2E plan'];
  const required = ['plan', 'install', 'ci_tests', 'environment', 'test', 'lint', 'types', 'build'];
  const failures = required.filter((id) => steps[id]?.outcome !== 'success')
    .map((id) => `${id}: expected success, received ${steps[id]?.outcome ?? 'missing'}`);
  for (const id of ['browser', 'e2e']) {
    const expected = e2e === 'true' ? 'success' : 'skipped';
    if (steps[id]?.outcome !== expected) failures.push(`${id}: expected ${expected}, received ${steps[id]?.outcome ?? 'missing'}`);
  }
  return failures;
}
