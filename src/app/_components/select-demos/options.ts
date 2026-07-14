import type {
  ProductSelectOption,
  SizeSelectOption,
  TextSelectOption,
} from './types'

export const textOptions = [
  {
    id: 'headline',
    label: 'Headline copy',
    description: '상품의 첫 인상을 짧고 강하게 잡습니다.',
    tone: 'Bold',
  },
  {
    id: 'body',
    label: 'Body copy',
    description: '구매 이유와 세부 정보를 차분하게 설명합니다.',
    tone: 'Calm',
  },
  {
    id: 'archived',
    label: 'Archived copy',
    description: '이전 캠페인 문구라 선택할 수 없습니다.',
    disabled: true,
    tone: 'Closed',
  },
] as const satisfies ReadonlyArray<TextSelectOption>

export const sizeOptions = [
  {
    id: 'small',
    label: 'Small',
    fit: '슬림한 실루엣',
    sizeGuide: '어깨 41cm / 총장 67cm',
  },
  {
    id: 'medium',
    label: 'Medium',
    fit: '가장 균형 잡힌 기본 핏',
    sizeGuide: '어깨 44cm / 총장 70cm',
  },
  {
    id: 'large',
    label: 'Large',
    fit: '여유 있는 레이어드 핏',
    sizeGuide: '어깨 48cm / 총장 73cm',
  },
  {
    id: 'xlarge',
    label: 'XLarge',
    fit: '현재 재입고 대기 중입니다.',
    disabled: true,
    sizeGuide: '어깨 52cm / 총장 76cm',
  },
] as const satisfies ReadonlyArray<SizeSelectOption>

export const productOptions = [
  {
    id: 'canvas-tote',
    label: 'Canvas tote',
    price: '38,000원',
    shippingNote: '오늘 출고',
    thumbnailText: 'CT',
  },
  {
    id: 'linen-shirt',
    label: 'Linen shirt',
    price: '86,000원',
    shippingNote: '내일 출고',
    thumbnailText: 'LS',
  },
  {
    id: 'wool-cap',
    label: 'Wool cap',
    price: '42,000원',
    shippingNote: '품절',
    disabled: true,
    thumbnailText: 'WC',
  },
] as const satisfies ReadonlyArray<ProductSelectOption>
