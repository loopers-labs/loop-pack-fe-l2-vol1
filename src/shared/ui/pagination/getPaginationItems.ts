import { cn } from 'tailwind-variants'

import { getPaginationPageNumbers } from './getPaginationPageNumbers'

type GetPaginationItemsParams = {
  readonly currentPage: number
  readonly totalPages: number
  readonly siblingCount: number
}

export type PaginationItem = {
  readonly value: number
  readonly disabled: boolean
  readonly ariaLabel: string
  readonly className: string | undefined
  readonly children: string
}

const paginationButtonClassName =
  'h-9 min-w-9 cursor-pointer rounded-md border border-[#ddd] bg-white text-[13px] disabled:cursor-not-allowed disabled:opacity-40'
const activePaginationButtonClassName = 'border-[#111] bg-[#111] text-white'

export function getPaginationItems({
  currentPage,
  totalPages,
  siblingCount,
}: GetPaginationItemsParams): Array<PaginationItem> {
  const pageNumbers = getPaginationPageNumbers({
    currentPage,
    siblingCount,
    totalPages,
  })

  return [
    {
      value: 1,
      disabled: currentPage === 1,
      ariaLabel: '첫 페이지',
      className: paginationButtonClassName,
      children: '«',
    },
    {
      value: currentPage - 1,
      disabled: currentPage === 1,
      ariaLabel: '이전 페이지',
      className: paginationButtonClassName,
      children: '‹',
    },
    ...pageNumbers.map((pageNumber) => ({
      value: pageNumber,
      disabled: false,
      ariaLabel: `페이지 ${String(pageNumber)}`,
      className: cn(
        paginationButtonClassName,
        pageNumber === currentPage && activePaginationButtonClassName,
      ),
      children: pageNumber.toString(),
    })),
    {
      value: currentPage + 1,
      disabled: currentPage === totalPages,
      ariaLabel: '다음 페이지',
      className: paginationButtonClassName,
      children: '›',
    },
    {
      value: totalPages,
      disabled: currentPage === totalPages,
      ariaLabel: '마지막 페이지',
      className: paginationButtonClassName,
      children: '»',
    },
  ]
}
