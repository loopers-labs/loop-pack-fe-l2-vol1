const { existsSync, readFileSync } = require("node:fs");

const STATS_PATH = ".next/diagnostics/route-bundle-stats.json";

const BUDGET_KB = {
  "/": 162,
  "/products": 166,
  "/checkout": 162,
  "/orders": 161,
  "/login": 155,
  "/mypage": 155,
};

if (!existsSync(STATS_PATH)) {
  throw new Error(`${STATS_PATH} 가 없습니다. 먼저 pnpm build 를 실행하세요.`);
}

const routeStats = JSON.parse(readFileSync(STATS_PATH, "utf8"));

const checks = routeStats
  .filter((stat) => stat.route in BUDGET_KB)
  .map((stat) => ({
    name: `First Load JS ${stat.route}`,
    path: stat.firstLoadChunkPaths.map((chunkPath) => chunkPath.split(/[\\/]/).join("/")),
    brotli: true,
    limit: `${BUDGET_KB[stat.route]} kB`,
  }));

const missingRoutes = Object.keys(BUDGET_KB).filter(
  (route) => !checks.some((check) => check.name === `First Load JS ${route}`),
);
if (missingRoutes.length > 0) {
  throw new Error(`예산이 걸린 route 의 번들 통계가 없습니다: ${missingRoutes.join(", ")}`);
}

module.exports = checks;
