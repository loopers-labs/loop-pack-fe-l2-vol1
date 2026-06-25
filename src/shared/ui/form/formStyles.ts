import { tv } from 'tailwind-variants'

export const textControl = tv({
  base: 'box-border w-full flex-1 rounded-lg border border-(--border) bg-(--bg) px-2.5 py-2.25 font-[inherit] text-sm text-(--text-h) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent) disabled:cursor-not-allowed disabled:opacity-45 aria-invalid:border-red-500',
})

export const choiceControl = tv({
  base: 'accent-(--accent) disabled:cursor-not-allowed disabled:opacity-45',
})
