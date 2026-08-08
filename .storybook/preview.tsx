import type { Preview } from '@storybook/nextjs-vite'
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css'
import '../src/app/globals.css'
import '../src/app/commerce.css'

const preview: Preview = {
  globalTypes: {
    theme: {
      description: '전역 테마',
      toolbar: {
        icon: 'paintbrush',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
      },
    },
  },
  initialGlobals: {
    theme: 'light',
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme === 'dark' ? 'dark' : 'light'
      document.documentElement.dataset.theme = theme

      return (
        <div
          className="week05-page"
          style={{ minHeight: '100vh', paddingTop: 40 }}
        >
          <Story />
        </div>
      )
    },
  ],
  parameters: {
    a11y: {
      test: 'error',
    },
    controls: {
      expanded: true,
    },
    layout: 'fullscreen',
  },
}

export default preview
