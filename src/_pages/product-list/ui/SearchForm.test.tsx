import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import SearchForm from './SearchForm'

describe('SearchForm', () => {
  it('입력 중에는 검색하지 않고 제출할 때 앞뒤 공백을 제거한다', () => {
    const handleSearch = vi.fn()
    render(<SearchForm initialQuery="coat" onSearch={handleSearch} />)

    const input = screen.getByRole('textbox', { name: 'Search' })
    fireEvent.change(input, { target: { value: '  cardigan  ' } })

    expect(handleSearch).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Search' }))

    expect(handleSearch).toHaveBeenCalledOnce()
    expect(handleSearch).toHaveBeenCalledWith('cardigan')
  })

  it('공백만 제출하면 빈 검색어를 전달해 기존 검색 조건을 제거한다', () => {
    const handleSearch = vi.fn()
    render(<SearchForm initialQuery="coat" onSearch={handleSearch} />)

    fireEvent.change(screen.getByRole('textbox', { name: 'Search' }), {
      target: { value: '   ' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Search' }))

    expect(handleSearch).toHaveBeenCalledWith('')
  })
})
