import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import ProductFilterSelect from './ProductFilterSelect'

const options = [
  { value: 'all', label: 'All' },
  { value: 'fashion', label: 'Fashion' },
]

describe('ProductFilterSelect', () => {
  it('선택된 값을 표시하고 옵션 선택을 전달한다', () => {
    const handleChange = vi.fn()

    render(
      <ProductFilterSelect
        label="Category"
        value="all"
        options={options}
        onChange={handleChange}
      />,
    )

    const trigger = screen.getByRole('combobox', { name: /Category/ })
    expect(trigger).toHaveTextContent('All')

    fireEvent.click(trigger)
    fireEvent.click(screen.getByRole('option', { name: 'Fashion' }))

    expect(handleChange).toHaveBeenCalledWith('fashion')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('키보드로 열고 다음 옵션을 선택한다', () => {
    const handleChange = vi.fn()

    render(
      <ProductFilterSelect
        label="Category"
        value="all"
        options={options}
        onChange={handleChange}
      />,
    )

    const trigger = screen.getByRole('combobox', { name: /Category/ })
    fireEvent.keyDown(trigger, { key: 'ArrowDown' })
    fireEvent.keyDown(trigger, { key: 'ArrowDown' })
    fireEvent.keyDown(trigger, { key: 'Enter' })

    expect(handleChange).toHaveBeenCalledWith('fashion')
  })

  it('활성 옵션을 combobox의 aria-activedescendant로 연결한다', () => {
    render(
      <ProductFilterSelect
        label="Category"
        value="all"
        options={options}
        onChange={vi.fn()}
      />,
    )

    const trigger = screen.getByRole('combobox', { name: /Category/ })
    fireEvent.keyDown(trigger, { key: 'ArrowDown' })

    expect(trigger).toHaveAttribute(
      'aria-activedescendant',
      screen.getByRole('option', { name: 'All' }).id,
    )
    expect(screen.getByRole('listbox')).not.toHaveAttribute(
      'aria-activedescendant',
    )
  })

  it('알 수 없는 선택값은 안전한 안내 문구로 표시하고 Escape로 닫는다', () => {
    render(
      <ProductFilterSelect
        label="Category"
        value="unknown"
        options={options}
        onChange={vi.fn()}
      />,
    )

    const trigger = screen.getByRole('combobox', { name: /Category/ })
    expect(trigger).toHaveTextContent('Select')

    fireEvent.keyDown(trigger, { key: 'Enter' })
    expect(screen.getByRole('listbox')).toBeInTheDocument()

    fireEvent.keyDown(trigger, { key: 'Escape' })
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
})
