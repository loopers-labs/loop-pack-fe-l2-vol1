import { Store } from '../../utils'
import type {
  SearchParams,
  SearchParamsSetOptions,
  SearchParamValue,
} from './types'

const DECIMAL_NUMBER_PATTERN = /^-?(?:\d+|\d*\.\d+)$/u
const NUMBER_PARAM_KEY_PATTERN =
  /^(?:page|pageSize|size|limit|offset|count|quantity|amount|price|rating|score|total|\w*(?:Count|Price|Amount|Quantity|Rate|Score|Total)|min[A-Z]\w*|max[A-Z]\w*)$/u
const BOOLEAN_PARAM_KEY_PATTERN =
  /^(?:is[A-Z]\w*|has[A-Z]\w*|can[A-Z]\w*|should[A-Z]\w*|inStock|\w*(?:Only|Enabled|Disabled|Visible|Checked|Selected))$/u

export class SearchParamsValue {
  private static popStateListenerAttached = false
  private static store: Store<string> | undefined

  private constructor() {}

  static read<TParams extends object>(search: string): SearchParams<TParams> {
    const urlSearchParams = new URLSearchParams(search)
    const searchParams: Partial<Record<string, SearchParamValue>> = {}

    urlSearchParams.forEach((serializedValue, key) => {
      const parsedValue = SearchParamsValue.parse(key, serializedValue)

      if (parsedValue !== undefined) {
        searchParams[key] = parsedValue
      }
    })

    return searchParams as SearchParams<TParams>
  }

  static write(
    patch: Readonly<Record<string, SearchParamValue | null | undefined>>,
    options: SearchParamsSetOptions = {},
  ): void {
    if (typeof window === 'undefined') {
      return
    }

    const url = new URL(window.location.href)
    const currentUrl = SearchParamsValue.toRelativeUrl(url)

    for (const key in patch) {
      const value = patch[key]

      if (value === null || value === undefined) {
        url.searchParams.delete(key)
        continue
      }

      const serializedValue = SearchParamsValue.serialize(value)

      if (serializedValue === null) {
        url.searchParams.delete(key)
        continue
      }

      url.searchParams.set(key, serializedValue)
    }

    const nextUrl = SearchParamsValue.toRelativeUrl(url)

    if (currentUrl === nextUrl) {
      return
    }

    if (options.history === 'replace') {
      window.history.replaceState(window.history.state, '', nextUrl)
    } else {
      window.history.pushState(window.history.state, '', nextUrl)
    }

    SearchParamsValue.getStore().setState(url.search)
  }

  static subscribe(listener: () => void): () => void {
    SearchParamsValue.attachPopStateListener()
    return SearchParamsValue.getStore().subscribe(listener)
  }

  static getSnapshot(): string {
    return SearchParamsValue.getStore().getState()
  }

  static getServerSnapshot(): string {
    return ''
  }

  private static parse(
    key: string,
    serializedValue: string,
  ): SearchParamValue | undefined {
    if (SearchParamsValue.isBooleanKey(key)) {
      return serializedValue === 'true'
    }

    if (SearchParamsValue.isNumberKey(key)) {
      return SearchParamsValue.parseNumber(serializedValue)
    }

    return serializedValue
  }

  private static parseNumber(serializedValue: string): number | undefined {
    const trimmedValue = serializedValue.trim()

    if (!DECIMAL_NUMBER_PATTERN.test(trimmedValue)) {
      return undefined
    }

    const parsedValue = Number(trimmedValue)
    return Number.isFinite(parsedValue) ? parsedValue : undefined
  }

  private static serialize(value: SearchParamValue): string | null {
    if (typeof value === 'number' && !Number.isFinite(value)) {
      return null
    }

    return String(value)
  }

  private static isNumberKey(key: string): boolean {
    return NUMBER_PARAM_KEY_PATTERN.test(key)
  }

  private static isBooleanKey(key: string): boolean {
    return BOOLEAN_PARAM_KEY_PATTERN.test(key)
  }

  private static attachPopStateListener(): void {
    if (
      typeof window === 'undefined' ||
      SearchParamsValue.popStateListenerAttached
    ) {
      return
    }

    window.addEventListener('popstate', () => {
      SearchParamsValue.getStore().setState(window.location.search)
    })
    SearchParamsValue.popStateListenerAttached = true
  }

  private static getStore(): Store<string> {
    if (SearchParamsValue.store === undefined) {
      SearchParamsValue.store = new Store(
        SearchParamsValue.getInitialSnapshot(),
      )
    }

    return SearchParamsValue.store
  }

  private static getInitialSnapshot(): string {
    if (typeof window === 'undefined') {
      return SearchParamsValue.getServerSnapshot()
    }

    return window.location.search
  }

  private static toRelativeUrl(url: URL): string {
    return `${url.pathname}${url.search}${url.hash}`
  }
}
