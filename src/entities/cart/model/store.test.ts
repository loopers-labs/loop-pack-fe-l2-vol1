import { beforeEach, describe, expect, it } from 'vitest';
import { useCartStore } from './store';

// 검증 대상: 개수를 저장하지 않고 목록에서 파생한다는 규칙.
// 선택자 훅(useCartCount)이 화면에 실제로 연결되는지는 담기 버튼과 함께 통합에서 본다.
describe('장바구니 스토어', () => {
  beforeEach(() => {
    useCartStore.setState({ cart: [] });
  });

  it('아무것도 담지 않았으면 목록이 비어 있어 개수가 0이다', () => {
    // getState()는 beforeEach가 넣은 값이라 초기 상태 검증이 못 된다(변이 실험에서 확인).
    // 스토어가 선언한 초기 상태 자체를 본다.
    expect(useCartStore.getInitialState().cart).toEqual([]);
  });

  it('담으면 목록에 들어가고 개수는 목록 길이로 늘어난다', () => {
    useCartStore.getState().toggleCart('p1');

    expect(useCartStore.getState().cart).toEqual(['p1']);
  });

  it('같은 상품을 다시 담으면 목록에서 빠져 개수가 0으로 돌아온다', () => {
    useCartStore.getState().toggleCart('p1');
    useCartStore.getState().toggleCart('p1');

    expect(useCartStore.getState().cart).toEqual([]);
  });

  it('같은 상품을 세 번 눌러도 목록에 중복 항목이 생기지 않는다', () => {
    useCartStore.getState().toggleCart('p1');
    useCartStore.getState().toggleCart('p1');
    useCartStore.getState().toggleCart('p1');

    expect(useCartStore.getState().cart).toEqual(['p1']);
  });

  it('다른 상품을 담아도 이미 담긴 상품은 그대로 남는다', () => {
    useCartStore.getState().toggleCart('p1');
    useCartStore.getState().toggleCart('p2');

    expect(useCartStore.getState().cart).toEqual(['p1', 'p2']);
  });

  it('가운데 상품만 빼도 나머지 순서는 유지된다', () => {
    useCartStore.getState().toggleCart('p1');
    useCartStore.getState().toggleCart('p2');
    useCartStore.getState().toggleCart('p3');

    useCartStore.getState().toggleCart('p2');

    expect(useCartStore.getState().cart).toEqual(['p1', 'p3']);
  });
});
