import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, within } from 'storybook/test'

function DesignFoundation() {
  return (
    <section style={{ display: 'grid', gap: 20 }}>
      <p data-testid="font-sample" style={{ fontSize: 32, fontWeight: 750 }}>
        Loop Market — Objects worth keeping.
      </p>
      <div
        data-testid="surface-sample"
        style={{
          padding: 24,
          color: 'var(--foreground)',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
        }}
      >
        Surface and border tokens
      </div>
    </section>
  )
}

const meta = {
  title: 'Foundation/Typography and theme',
  component: DesignFoundation,
  tags: ['test'],
} satisfies Meta<typeof DesignFoundation>

export default meta
type Story = StoryObj<typeof meta>

export const Light: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const fontSample = canvas.getByTestId('font-sample')

    await expect(getComputedStyle(fontSample).fontFamily).toContain(
      'Pretendard Variable',
    )
    await expect(document.documentElement.dataset.theme).toBe('light')
  },
}

export const Dark: Story = {
  globals: { theme: 'dark' },
  play: async () => {
    await expect(document.documentElement.dataset.theme).toBe('dark')
  },
}
