// playwright.config.ts의 json 리포터 outputFile과 같은 경로 —
// 리포터가 쓰고 assert-e2e·e2e-summary가 읽는다. 경로를 바꾸면 config도 함께 바꾼다.
export const E2E_REPORT_PATH = 'reports/e2e-results.json';
