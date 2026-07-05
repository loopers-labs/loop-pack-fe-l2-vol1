import { DebouncedInput } from '@/shared/ui'

type SearchInputProps = {
  readonly onSearchChange: (searchQuery: string) => void
  readonly searchQuery: string
  readonly syncKey: number
}

export function SearchInput({
  onSearchChange,
  searchQuery,
  syncKey,
}: SearchInputProps) {
  return (
    <DebouncedInput
      aria-label="상품 검색"
      type="search"
      placeholder="상품 검색..."
      syncKey={syncKey}
      value={searchQuery}
      onValueChange={onSearchChange}
      className="flex-1 rounded-md border border-[#ddd] px-3.5 py-2.5 text-sm"
    />
  )
}
