import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import ProductFilterSelect from './ProductFilterSelect'
import SearchForm from './SearchForm'

const categoryOptions = [
  { value: 'all', label: 'All' },
  { value: 'casual', label: 'Casual' },
  { value: 'fashion', label: 'Fashion' },
]

const sortOptions = [
  { value: 'latest', label: 'Newest' },
  { value: 'popular', label: 'Popular' },
]

function ProductListControls() {
  const [category, setCategory] = useState('all')
  const [sort, setSort] = useState('latest')

  return (
    <div className="week05-filters">
      <SearchForm initialQuery="" onSearch={fn()} />
      <ProductFilterSelect
        label="Category"
        value={category}
        options={categoryOptions}
        onChange={setCategory}
      />
      <ProductFilterSelect
        label="Sort"
        value={sort}
        options={sortOptions}
        onChange={setSort}
      />
    </div>
  )
}

const meta = {
  title: 'Product list/Controls composition',
  component: ProductListControls,
  tags: ['test'],
} satisfies Meta<typeof ProductListControls>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const SearchFocused: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const searchInput = canvas.getByRole('textbox', { name: 'Search' })

    await userEvent.click(searchInput)
    await expect(searchInput).toHaveFocus()
    await expect(getComputedStyle(searchInput).outlineStyle).toBe('none')
  },
}

export const CategoryOpen: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const category = canvas.getByRole('combobox', { name: /Category/ })

    await userEvent.click(category)
    await expect(canvas.getByRole('listbox')).toBeVisible()
  },
}

export const Dark: Story = {
  globals: { theme: 'dark' },
}
