export type SearchParamValue = string | number | boolean

type SearchParamKey<TParams extends object> = Extract<keyof TParams, string>
type SearchParamValueOf<TValue> = Extract<TValue, SearchParamValue>

export type SearchParams<TParams extends object> = Readonly<{
  readonly [Key in SearchParamKey<TParams>]?: SearchParamValueOf<TParams[Key]>
}>

export type SearchParamsPatch<TParams extends object> = Readonly<{
  readonly [Key in SearchParamKey<TParams>]?:
    | SearchParamValueOf<TParams[Key]>
    | null
    | undefined
}>

export type SearchParamsSetOptions = {
  readonly history?: 'push' | 'replace'
}

export type SearchParamsUpdater<TParams extends object> = (
  prevParams: SearchParams<TParams>,
) => SearchParamsPatch<TParams>

export type SearchParamsSetState<TParams extends object> = (
  nextParams: SearchParamsPatch<TParams> | SearchParamsUpdater<TParams>,
  options?: SearchParamsSetOptions,
) => void

export type UseSearchParamsReturn<TParams extends object> = readonly [
  searchParams: SearchParams<TParams>,
  setSearchParams: SearchParamsSetState<TParams>,
]
