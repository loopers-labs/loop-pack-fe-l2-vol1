// Hero가 실제로 그려지는 크기와 내려받은 후보가 맞는지 잰다.
// sizes는 박스 폭이 아니라 object-fit: cover가 그리는 폭이라, 세로 박스에서는 박스 폭으로
// 신고하면 절반짜리 후보가 내려와 확대된다. 배율과 원본 대비 픽셀 차이를 함께 남긴다.

import {
  baseUrl,
  measuredSha,
  waitForImages,
  withPage,
  writeResult,
} from './harness.mjs'

const ORIGINAL_FILE = 'hero-original.jpg'
const ORIGINAL = `/images/week-07/${ORIGINAL_FILE}`
const HERO = '.week07-hero-image'

const measure = (viewportName) =>
  withPage(viewportName, async (page, viewport) => {
    const heroResponse = {}
    page.on('response', async (response) => {
      // Hero만 잡아야 한다. _next/image로 넓게 보면 나중에 도착한 상품 카드가 덮어쓴다.
      const url = response.url()
      if (!decodeURIComponent(url).includes(ORIGINAL_FILE)) return
      try {
        heroResponse.bodyBytes = (await response.body()).length
        heroResponse.url = url.replace(baseUrl(), '')
      } catch {
        // 응답 본문을 못 읽어도 기하 측정은 계속한다.
      }
    })

    await page.goto(`${baseUrl()}/`, { waitUntil: 'networkidle' })
    await waitForImages(page)

    const geometry = await page.evaluate(
      ({ heroSelector, originalWidth, originalHeight }) => {
        const image = document.querySelector(heroSelector)
        const box = image.getBoundingClientRect()
        const imageRatio = originalWidth / originalHeight
        // cover는 박스를 덮도록 확대한 뒤 잘라낸다. 실제로 그려지는 폭은 박스 폭이
        // 아니라 덮는 데 필요한 폭이다.
        const drawnCssWidth = Math.max(box.width, box.height * imageRatio)
        const candidate = new URL(
          image.currentSrc,
          location.origin,
        ).searchParams.get('w')
        return {
          box: { width: Math.round(box.width), height: Math.round(box.height) },
          boxRatio: Number((box.width / box.height).toFixed(3)),
          imageRatio: Number(imageRatio.toFixed(3)),
          bindingEdge: box.width / box.height < imageRatio ? 'height' : 'width',
          drawnCssWidth: Math.round(drawnCssWidth),
          devicePxNeeded: Math.round(drawnCssWidth * window.devicePixelRatio),
          candidateWidthPx: candidate ? Number(candidate) : null,
          upscale: candidate
            ? Number(
                (
                  (drawnCssWidth * window.devicePixelRatio) /
                  Number(candidate)
                ).toFixed(2),
              )
            : null,
          objectFit: getComputedStyle(image).objectFit,
          objectPosition: getComputedStyle(image).objectPosition,
        }
      },
      { heroSelector: HERO, originalWidth: 3840, originalHeight: 2160 },
    )

    // 화면에 실제로 보이는 픽셀끼리 비교한다. 캔버스 전체에 늘려 그리면 cover가 잘라낸
    // 영역까지 섞여, 표시 화질이 아니라 다른 그림을 비교하게 된다.
    const pixelDiff = await page.evaluate(
      async ({ box, heroSelector, originalPath, objectPosition }) => {
        const load = (src) =>
          new Promise((resolve, reject) => {
            const image = new Image()
            image.onload = () => resolve(image)
            image.onerror = reject
            image.src = src
          })

        const percent = (token) => {
          if (token.endsWith('%')) return Number(token.slice(0, -1)) / 100
          if (token === 'left' || token === 'top') return 0
          if (token === 'right' || token === 'bottom') return 1
          return 0.5
        }
        const [posX, posY] = objectPosition.split(/\s+/).map(percent)

        const dpr = window.devicePixelRatio
        const targetWidth = Math.round(box.width * dpr)
        const targetHeight = Math.round(box.height * dpr)

        // object-fit: cover와 object-position이 고르는 원본 영역을 그대로 잘라 그린다.
        const drawCover = (image) => {
          const scale = Math.max(
            box.width / image.naturalWidth,
            box.height / image.naturalHeight,
          )
          const sourceWidth = box.width / scale
          const sourceHeight = box.height / scale
          const sourceX = (image.naturalWidth - sourceWidth) * posX
          const sourceY = (image.naturalHeight - sourceHeight) * posY
          const canvas = document.createElement('canvas')
          canvas.width = targetWidth
          canvas.height = targetHeight
          const context = canvas.getContext('2d')
          context.drawImage(
            image,
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,
            0,
            0,
            targetWidth,
            targetHeight,
          )
          return context.getImageData(0, 0, targetWidth, targetHeight).data
        }

        const optimized = drawCover(
          await load(document.querySelector(heroSelector).currentSrc),
        )
        const original = drawCover(await load(originalPath))
        let total = 0
        let max = 0
        let samples = 0
        for (let i = 0; i < optimized.length; i += 4) {
          for (let channel = 0; channel < 3; channel += 1) {
            const diff = Math.abs(
              optimized[i + channel] - original[i + channel],
            )
            total += diff
            if (diff > max) max = diff
            samples += 1
          }
        }
        return {
          comparedAt: `${targetWidth}x${targetHeight} device px`,
          objectPosition,
          meanAbsDiff: Number((total / samples).toFixed(2)),
          maxChannelDiff: max,
          comparedPixels: samples / 3,
        }
      },
      {
        box: geometry.box,
        heroSelector: HERO,
        originalPath: ORIGINAL,
        objectPosition: geometry.objectPosition,
      },
    )

    return { viewport, ...geometry, pixelDiff, heroResponse }
  })

const runs = {}
for (const viewportName of ['mobile', 'desktop']) {
  runs[viewportName] = await measure(viewportName)
}

await writeResult('hero-geometry.json', {
  measuredSha: measuredSha(),
  conditions: {
    url: `${baseUrl()}/`,
    build: 'production (next build && next start)',
    viewports: '412x823 DPR 1.75 / 1280x900 DPR 1',
    cpuThrottle: 'none',
    networkThrottle: 'none',
    heroResponse:
      'bodyBytes는 응답 본문 크기다. Lighthouse의 transferSize와 헤더 포함 여부가 달라 값이 조금 다르다',
    pixelDiff:
      'object-fit: cover와 object-position이 고른 영역을 device px 해상도로 잘라 비교한다',
    note: '원본은 3840x2160. upscale이 1을 넘으면 확대되어 표시된다.',
  },
  runs,
})

// 여기부터는 기록이 아니라 판정이다.
// sizes를 실제 렌더 폭보다 좁게 신고하면 전송량은 줄고 화면은 늘어난 이미지가 된다.
// 눈으로 봐야 잡히는 결함이라 사람이 안 보면 그대로 배포된다. 배율을 판정선으로 고정한다.
// 후보 폭이 이산값이라 딱 1.0으로 떨어지지 않는다. 반올림 여유만 남긴다.
const MAX_UPSCALE = 1.05

const enlarged = Object.entries(runs).filter(
  ([, run]) => run.upscale !== null && run.upscale > MAX_UPSCALE,
)

for (const [viewportName, run] of Object.entries(runs)) {
  process.stdout.write(
    `${viewportName}: 그려지는 폭 ${run.drawnCssWidth} CSS px, 필요 ${run.devicePxNeeded} device px, 받은 후보 ${run.candidateWidthPx}w, 배율 ${run.upscale}\n`,
  )
}

if (enlarged.length > 0) {
  for (const [viewportName, run] of enlarged) {
    process.stderr.write(
      `${viewportName}에서 Hero가 ${run.upscale}배 확대된다. ` +
        `sizes가 신고한 폭이 실제 렌더 폭 ${run.drawnCssWidth} CSS px보다 좁다.\n`,
    )
  }
  process.exitCode = 1
}
