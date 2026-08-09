import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, within } from 'storybook/test'
import Header from './Header'

const meta = {
  title: 'Layout/GNB',
  component: Header,
  tags: ['test'],
} satisfies Meta<typeof Header>

export default meta
type Story = StoryObj<typeof meta>

export const Light: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const shop = canvas.getByRole('link', { name: 'Shop' })
    await expect(canvas.getByRole('link', { name: 'Components' })).toBeVisible()
    await expect(canvas.getByRole('combobox', { name: 'Theme' })).toBeVisible()
    const wishlist = canvas.getByText('Wishlist 0')
    const bag = canvas.getByText('Bag 0')
    const shopStyle = getComputedStyle(shop)

    for (const counter of [wishlist, bag]) {
      const counterStyle = getComputedStyle(counter)
      await expect(counterStyle.fontFamily).toBe(shopStyle.fontFamily)
      await expect(counterStyle.fontSize).toBe(shopStyle.fontSize)
      await expect(counterStyle.fontWeight).toBe(shopStyle.fontWeight)
    }
  },
}

export const Dark: Story = {
  globals: { theme: 'dark' },
}
