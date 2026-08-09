import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import HeroSection from './HeroSection'

const meta = {
  title: 'Home/Hero',
  component: HeroSection,
  args: {
    title: 'Everyday objects, thoughtfully selected.',
    description: 'Discover pieces designed to stay with you for a long time.',
  },
  tags: ['test'],
} satisfies Meta<typeof HeroSection>

export default meta
type Story = StoryObj<typeof meta>

export const Light: Story = {}

export const Dark: Story = {
  globals: { theme: 'dark' },
}
