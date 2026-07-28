import { createCollectionStore } from '@/store/createCollectionStore'

// 팩토리로 찍은 위시리스트 store. 로직이 장바구니와 갈라지면 이 파일만 독립 구현으로 바꾼다.
export const useWishlistStore = createCollectionStore('wishlist')
