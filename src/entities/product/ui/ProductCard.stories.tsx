import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, within } from 'storybook/test'
import ProductCard from './ProductCard'

const product = {
  id: 'p1',
  brand: 'Loopers Select',
  name: 'Winter Rocky Pants — Original',
  category: 'casual' as const,
  price: 79000,
  originalPrice: null,
  image: '/images/products/p1.jpg',
  freeShipping: true,
  sizes: [],
  rating: 4.8,
  reviewCount: 312,
  createdAt: '2026-07-09T09:00:00.000Z',
}

const meta = {
  title: 'Product/Product card',
  component: ProductCard,
  args: {
    product,
    actions: (
      <>
        <button type="button">Wishlist</button>
        <button type="button">Add to bag</button>
      </>
    ),
  },
  decorators: [
    (Story) => (
      <div style={{ width: 320 }}>
        <Story />
      </div>
    ),
  ],
  tags: ['test'],
} satisfies Meta<typeof ProductCard>

export default meta
type Story = StoryObj<typeof meta>

export const Light: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole('img')).toHaveAttribute('alt', product.name)
    await expect(
      canvas.getByRole('heading', { name: product.name }),
    ).toBeVisible()
    await expect(canvas.getByText('79,000원')).toBeVisible()
    await expect(
      canvas.getByRole('button', { name: 'Add to bag' }),
    ).toBeVisible()
  },
}

export const Dark: Story = {
  globals: { theme: 'dark' },
}
