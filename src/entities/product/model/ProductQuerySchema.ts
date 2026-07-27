import { z } from 'zod'

export const categorySchema = z.enum([
  'all',
  'casual',
  'fashion',
  'goods',
  'home',
  'digital',
])
export const sortSchema = z.enum([
  'latest',
  'popular',
  'price-asc',
  'price-desc',
])
export const pageSchema = z.number().int().positive().catch(1)
export const querySchema = z.string().catch('')

export const DEFAULT_PAGE_SIZE = 12

export const categoryOptions = [
  { value: 'all', label: '전체' },
  { value: 'casual', label: '캐주얼' },
  { value: 'fashion', label: '패션' },
  { value: 'goods', label: '뷰티·잡화' },
  { value: 'home', label: '홈' },
  { value: 'digital', label: '디지털' },
] as const satisfies ReadonlyArray<{
  value: z.infer<typeof categorySchema>
  label: string
}>

export const sortOptions = [
  { value: 'latest', label: '최신순' },
  { value: 'popular', label: '인기순' },
  { value: 'price-asc', label: '낮은 가격순' },
  { value: 'price-desc', label: '높은 가격순' },
] as const satisfies ReadonlyArray<{
  value: z.infer<typeof sortSchema>
  label: string
}>

export const parseCategory = (
  value: string,
): z.infer<typeof categorySchema> => {
  const result = categorySchema.safeParse(value)
  return result.success ? result.data : 'all'
}

export const parseSort = (value: string): z.infer<typeof sortSchema> => {
  const result = sortSchema.safeParse(value)
  return result.success ? result.data : 'latest'
}
