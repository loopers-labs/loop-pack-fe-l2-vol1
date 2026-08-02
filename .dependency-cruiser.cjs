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
      name: "fsd-no-upward-shared",
      severity: "error",
      comment: "shared 는 상위 FSD 계층을 import 하지 않는다",
      from: { path: "^src/shared/" },
      to: { path: "^src/(entities|features|widgets|_pages|_app)/" },
    },
    {
      name: "fsd-no-upward-entities",
      severity: "error",
      comment: "entities 는 features, widgets, _pages, _app 을 import 하지 않는다",
      from: { path: "^src/entities/" },
      to: { path: "^src/(features|widgets|_pages|_app)/" },
    },
    {
      name: "fsd-no-upward-features",
      severity: "error",
      comment: "features 는 widgets, _pages, _app 을 import 하지 않는다",
      from: { path: "^src/features/" },
      to: { path: "^src/(widgets|_pages|_app)/" },
    },
    {
      name: "fsd-no-upward-widgets",
      severity: "error",
      comment: "widgets 는 _pages, _app 을 import 하지 않는다",
      from: { path: "^src/widgets/" },
      to: { path: "^src/(_pages|_app)/" },
    },
    {
      name: "fsd-no-upward-pages",
      severity: "error",
      comment: "_pages 는 _app 을 import 하지 않는다",
      from: { path: "^src/_pages/" },
      to: { path: "^src/_app/" },
    },
    {
      name: "fsd-no-cross-slice",
      severity: "error",
      comment: "동일 FSD 계층의 다른 slice 를 직접 import 하지 않는다",
      from: { path: "^src/(_pages|widgets|features)/([^/]+)/" },
      to: {
        path: "^src/$1/",
        pathNot: "^src/$1/$2/",
      },
    },
    {
      name: "fsd-no-cross-entity-slice",
      severity: "error",
      comment: "Entity 간에는 소비자 전용 @x 진입점만 예외로 허용한다",
      from: { path: "^src/entities/([^/]+)/" },
      to: {
        path: "^src/entities/",
        pathNot: ["^src/entities/$1/", "^src/entities/[^/]+/@x/$1\\.ts$"],
      },
    },
    {
      name: "fsd-entry-point-only-slices",
      severity: "error",
      comment: "다른 FSD slice 는 index.ts 공개 API로만 import 한다",
      from: { path: "^src/(_pages|widgets|features)/([^/]+)/" },
      to: {
        path: "^src/(_pages|widgets|features|entities)/[^/]+/",
        pathNot: ["^src/$1/$2/", "^src/(_pages|widgets|features|entities)/[^/]+/index\\.ts$"],
      },
    },
    {
      name: "fsd-entry-point-only-entity-slices",
      severity: "error",
      comment: "Entity 외부 접근은 index.ts 또는 소비자 전용 @x 진입점만 허용한다",
      from: { path: "^src/entities/([^/]+)/" },
      to: {
        path: "^src/entities/[^/]+/",
        pathNot: [
          "^src/entities/$1/",
          "^src/entities/[^/]+/index\\.ts$",
          "^src/entities/[^/]+/@x/$1\\.ts$",
        ],
      },
    },
    {
      name: "fsd-entry-point-only-shared-ui",
      severity: "error",
      comment: "shared/ui 컴포넌트는 index.ts 공개 API로만 import 한다",
      from: { path: "^src/(_pages|widgets|features|entities)/([^/]+)/" },
      to: {
        path: "^src/shared/ui/[^/]+/",
        pathNot: "^src/shared/ui/[^/]+/index\\.ts$",
      },
    },
    {
      name: "fsd-entry-point-only-shared-api",
      severity: "error",
      comment: "shared/api 외부 FSD 코드는 index.ts 공개 API로만 접근한다",
      from: {
        path: "^src/(_app|_pages/[^/]+|widgets/[^/]+|features/[^/]+|entities/[^/]+|shared/ui/[^/]+)/",
      },
      to: {
        path: "^src/shared/api/",
        pathNot: "^src/shared/api/index\\.ts$",
      },
    },
    {
      name: "fsd-entry-point-only-shared-api-shared-ui",
      severity: "error",
      comment: "shared/api 는 shared/ui 컴포넌트의 index.ts 공개 API로만 import 한다",
      from: { path: "^src/shared/api/" },
      to: {
        path: "^src/shared/ui/[^/]+/",
        pathNot: "^src/shared/ui/[^/]+/index\\.ts$",
      },
    },
    {
      name: "fsd-entry-point-only-shared-ui-internal",
      severity: "error",
      comment: "shared/ui 내부에서도 다른 컴포넌트는 index.ts 공개 API로만 import 한다",
      from: { path: "^src/shared/ui/([^/]+)/" },
      to: {
        path: "^src/shared/ui/[^/]+/",
        pathNot: ["^src/shared/ui/$1/", "^src/shared/ui/[^/]+/index\\.ts$"],
      },
    },
    {
      name: "fsd-entry-point-only-app",
      severity: "error",
      comment: "단일 _app slice 는 하위 slice 의 index.ts 공개 API로만 import 한다",
      from: { path: "^src/_app/" },
      to: {
        path: "^src/(_pages|widgets|features|entities)/[^/]+/",
        pathNot: "^src/(_pages|widgets|features|entities)/[^/]+/index\\.ts$",
      },
    },
    {
      name: "fsd-entry-point-only-app-shared-ui",
      severity: "error",
      comment: "단일 _app slice 는 shared/ui 컴포넌트의 index.ts 공개 API로만 import 한다",
      from: { path: "^src/_app/" },
      to: {
        path: "^src/shared/ui/[^/]+/",
        pathNot: "^src/shared/ui/[^/]+/index\\.ts$",
      },
    },
  ],
  options: {
    tsConfig: { fileName: "tsconfig.json" },
    tsPreCompilationDeps: true,
    doNotFollow: { path: "node_modules" },
    exclude: { path: "\\.css$|/assets/" },
  },
};
