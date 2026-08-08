import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import SearchForm from './SearchForm'

const meta = {
  title: 'Product list/Search form',
  component: SearchForm,
  args: {
    initialQuery: '',
    onSearch: fn(),
  },
  decorators: [
    (Story) => (
      <div
        className="week05-filters"
        style={{ gridTemplateColumns: 'minmax(360px, 1fr)', maxWidth: 1000 }}
      >
        <Story />
      </div>
    ),
  ],
  tags: ['test'],
} satisfies Meta<typeof SearchForm>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithQuery: Story = {
  args: {
    initialQuery: '가디건',
  },
}

export const Focused: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const searchInput = canvas.getByRole('textbox', { name: 'Search' })

    await userEvent.click(searchInput)
    await expect(searchInput).toHaveFocus()
  },
}
