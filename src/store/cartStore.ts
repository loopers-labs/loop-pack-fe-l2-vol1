import { createCollectionStore } from '@/store/createCollectionStore'

// 팩토리로 찍은 장바구니 store. 수량 등 위시리스트와 다른 로직이 필요해지면 이 파일만 독립 구현으로 바꾼다.
export const useCartStore = createCollectionStore('cart')
