/* global module */
/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "no-circular",
      severity: "error",
      comment: "순환 의존 금지",
      from: {},
      to: { circular: true },
    },
    {
      name: "shared-is-independent",
      severity: "error",
      comment: "shared 는 feature/app 을 import 하지 않는다 (단방향 shared → 피처 → app)",
      from: { path: "^src/shared/" },
      to: { path: "^src/", pathNot: "^src/(shared|assets)/" },
    },
    {
      name: "no-cross-feature",
      severity: "error",
      comment: "피처는 다른 피처를 직접 import 하지 않는다 (조립은 app 에서)",
      from: { path: "^src/([^/]+)/", pathNot: "^src/(shared|assets)/" },
      to: {
        path: "^src/([^/]+)/",
        pathNot: ["^src/$1/", "^src/(shared|assets)/"],
      },
    },
    {
      name: "feature-barrel-only",
      severity: "error",
      comment: "피처 밖에서는 피처의 index(배럴)로만 import — 내부 파일 직접 import 금지",
      from: { path: "^src/[^/]+\\.tsx?$" },
      to: {
        path: "^src/(?!shared/|assets/)[^/]+/",
        pathNot: "^src/[^/]+/index\\.(ts|tsx)$",
      },
    },
  ],
  options: {
    tsConfig: { fileName: "tsconfig.app.json" },
    tsPreCompilationDeps: true,
    doNotFollow: { path: "node_modules" },
    exclude: { path: "\\.css$|/assets/" },
  },
};
