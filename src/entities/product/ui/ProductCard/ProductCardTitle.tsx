import { For, Show } from '@ilokesto/utilinent'

type ProductCardTitleProps = {
  readonly highlightQuery: string
  readonly title: string
}

const escapeRegExp = (text: string) =>
  text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export function ProductCardTitle({
  highlightQuery,
  title,
}: ProductCardTitleProps) {
  return (
    <h3 className="m-0 mb-2 text-sm leading-[1.35] font-medium">
      <HighlightedText highlightQuery={highlightQuery} text={title} />
    </h3>
  )
}

type HighlightedTextProps = {
  readonly highlightQuery: string
  readonly text: string
}

function HighlightedText({ highlightQuery, text }: HighlightedTextProps) {
  if (!highlightQuery) return <>{text}</>

  const escapedSearchQuery = escapeRegExp(highlightQuery)
  const parts = text.split(new RegExp(`(${escapedSearchQuery})`, 'gi'))

  return (
    <>
      <For each={parts}>
        {(part, index) => (
          <Show
            key={`${part}-${String(index)}`}
            when={part.toLowerCase() === highlightQuery.toLowerCase()}
            fallback={part}
          >
            <mark className="bg-[#fff176] p-0">{part}</mark>
          </Show>
        )}
      </For>
    </>
  )
}
