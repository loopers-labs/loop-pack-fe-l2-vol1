import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import ProductListPage from './ProductListPage'
import { PRODUCT_PAGE_SIZE } from '../model/searchParams'

// 서버 셸이 조회를 기다리는 동안 무엇을 내보내는지 고정한다.
// 이 파일이 지키는 것은 문구가 아니라 "hard navigation 최초 진입에서 결과가 들어올 자리를
// 잡았는가"다. fallback을 빈 div로 되돌리면 제목 아래가 응답이 끝날 때까지 비는데,
// ProductListView만 렌더하는 테스트로는 그 회귀를 잡지 못한다.

// 서버 렌더는 Suspense 경계 안의 async 컴포넌트를 기다리지 않고 fallback을 내보낸다.
// 영원히 완료되지 않는 searchParams를 주면 그 상태가 그대로 초기 HTML이 된다.
const renderPendingShell = () =>
  renderToStaticMarkup(<ProductListPage searchParams={new Promise(() => {})} />)

describe('상품 목록 서버 셸', () => {
  it('조회를 기다리는 동안에도 제목과 설명을 먼저 내보낸다', () => {
    const markup = renderPendingShell()

    expect(markup.match(/<h1[\s>]/g)).toHaveLength(1)
    expect(markup).toContain('Products')
    expect(markup).toContain('Objects worth keeping')
  })

  it('결과가 들어올 자리를 실제 목록과 같은 수로 예약한다', () => {
    const markup = renderPendingShell()

    // 카드 수가 실제 한 페이지와 같아야 교체가 조용하다. 이 수가 줄면 결과가 도착할 때
    // 그만큼 아래 콘텐츠가 밀린다.
    // week05-product-brand 같은 하위 클래스와 겹치지 않게 카드 자체만 센다.
    expect(markup.match(/class="week05-product"/g)).toHaveLength(
      PRODUCT_PAGE_SIZE,
    )

    // 그리드만 잡으면 부족하다. 개수 행, 성공 상태가 늘 비워 두는 안내 행,
    // 페이지네이션까지 있어야 결과 블록 전체의 높이가 맞는다.
    expect(markup).toContain('product-result-count')
    expect(markup).toContain('product-result-notice')
    expect(markup).toContain('week05-pagination')

    // 필터 줄도 실제와 같은 클래스로 자리를 잡아야 한다. 임의의 막대를 쌓으면
    // 높이가 어긋나 결과가 도착할 때 아래가 통째로 내려간다.
    expect(markup.match(/product-filter-trigger/g)).toHaveLength(3)
  })

  it('결과 영역의 역할과 진행 중이라는 사실을 fallback에서도 알린다', () => {
    const markup = renderPendingShell()

    // 이 속성이 fallback에만 없으면 region이 생겼다 사라진다.
    expect(markup).toContain('aria-label="Product results"')
    expect(markup).toContain('aria-busy="true"')
  })
})
