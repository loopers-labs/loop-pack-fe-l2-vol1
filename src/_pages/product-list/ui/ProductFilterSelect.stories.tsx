import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import ProductFilterSelect from './ProductFilterSelect'

const categoryOptions = [
  { value: 'all', label: 'All' },
  { value: 'casual', label: 'Casual' },
  { value: 'fashion', label: 'Fashion' },
  { value: 'goods', label: 'Beauty & Goods' },
  { value: 'home', label: 'Home' },
  { value: 'digital', label: 'Digital' },
]

const meta = {
  title: 'Product list/Filter select',
  component: ProductFilterSelect,
  args: {
    label: 'Category',
    value: 'all',
    options: categoryOptions,
    onChange: fn(),
  },
  decorators: [
    (Story) => (
      <div style={{ width: 240, minHeight: 420 }}>
        <Story />
      </div>
    ),
  ],
  tags: ['test'],
} satisfies Meta<typeof ProductFilterSelect>

export default meta
type Story = StoryObj<typeof meta>

export const Closed: Story = {}

export const Open: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole('combobox', { name: /Category/ })

    await userEvent.click(trigger)
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await expect(canvas.getByRole('listbox')).toBeVisible()
  },
}

export const KeyboardSelection: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole('combobox', { name: /Category/ })

    await userEvent.click(trigger)
    await userEvent.keyboard('{ArrowDown}{Enter}')
    await expect(args.onChange).toHaveBeenCalledWith('casual')
  },
}
