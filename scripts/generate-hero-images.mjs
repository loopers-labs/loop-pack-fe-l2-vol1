/* eslint-disable no-console -- 생성 결과를 사람이 확인하는 CLI 스크립트다. */

/**
 * Hero 이미지 후보 생성.
 *
 * 원본(3840x2160, 16:9)에서 뷰포트별 후보를 만든다.
 * 모바일은 CSS 가 4:5 로 잘라 쓰므로 미리 잘라 둔다. 크롭 기준점은 CSS 의
 * `object-position: 56% center` 를 그대로 따른다.
 *
 *   pnpm images:hero
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

import sharp from 'sharp';

const SOURCE = 'public/images/week-07/hero-original.jpg';
const OUT_DIR = 'public/images/week-07';

/** CSS `object-position: 56% center` 와 같은 기준점 */
const FOCAL_X = 0.56;

const VARIANTS = [
  {
    name: 'portrait',
    /** `@media (max-width: 640px)` 의 `aspect-ratio: 4 / 5` */
    ratio: 4 / 5,
    widths: [600, 900],
  },
  {
    name: 'landscape',
    /** 기본 `aspect-ratio: 16 / 9` */
    ratio: 16 / 9,
    widths: [1280, 1920],
  },
];

const FORMATS = [
  { ext: 'avif', apply: (pipeline) => pipeline.avif({ quality: 55, effort: 6 }) },
  { ext: 'webp', apply: (pipeline) => pipeline.webp({ quality: 78 }) },
  { ext: 'jpg', apply: (pipeline) => pipeline.jpeg({ quality: 82, mozjpeg: true }) },
];

/**
 * 원본에서 목표 비율만큼을 잘라낼 영역.
 *
 * 좌우 위치는 CSS `object-fit: cover` + `object-position: X%` 와 같은 규칙을 쓴다.
 * X% 는 "이미지의 X 지점을 가운데 둔다"가 아니라 "넘치는 폭을 X : (100-X) 로 나눠
 * 왼쪽에 배분한다"는 뜻이다. 중심 기준으로 계산하면 구도가 어긋난다.
 */
function cropBox({ sourceWidth, sourceHeight, ratio }) {
  const width = Math.min(sourceWidth, Math.round(sourceHeight * ratio));
  const height = Math.min(sourceHeight, Math.round(width / ratio));
  const left = Math.round((sourceWidth - width) * FOCAL_X);
  const top = Math.round((sourceHeight - height) / 2);

  return { left, top, width, height };
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const { width: sourceWidth, height: sourceHeight } = await sharp(SOURCE).metadata();
  console.log(`source ${sourceWidth}x${sourceHeight}\n`);

  for (const variant of VARIANTS) {
    const box = cropBox({ sourceWidth, sourceHeight, ratio: variant.ratio });

    for (const width of variant.widths) {
      const height = Math.round(width / variant.ratio);

      for (const format of FORMATS) {
        const file = path.join(OUT_DIR, `hero-${variant.name}-${width}.${format.ext}`);
        const info = await format
          .apply(sharp(SOURCE).extract(box).resize(width, height, { fit: 'cover' }))
          .toFile(file);

        console.log(`${file.padEnd(52)} ${width}x${height}  ${(info.size / 1024).toFixed(1)} kB`);
      }
    }
  }
}

await main();
