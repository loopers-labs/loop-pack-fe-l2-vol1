export type UseAsyncStatus = 'idle' | 'pending' | 'success' | 'error'

type UseAsyncBaseOptions<TData> = {
  readonly deps: ReadonlyArray<unknown>
  readonly enabled?: boolean
  readonly initialData?: TData
  readonly keepPreviousData?: boolean
  readonly onSuccess?: (data: TData) => void
  readonly onError?: (error: Error) => void
}

export type UseAsyncOptions<TAsyncData> = UseAsyncBaseOptions<TAsyncData> & {
  readonly asyncFn: () => Promise<TAsyncData>
  readonly selectFn?: undefined
  readonly selectDeps?: ReadonlyArray<unknown>
}

export type UseAsyncSelectOptions<TAsyncData, TData> =
  UseAsyncBaseOptions<TData> & {
    readonly asyncFn: () => Promise<TAsyncData>
    readonly selectFn: (data: TAsyncData) => TData
    readonly selectDeps?: ReadonlyArray<unknown>
  }

export type UseAsyncResult<TData> = {
  readonly data: TData | undefined
  readonly error: Error | null
  readonly status: UseAsyncStatus
  readonly isIdle: boolean
  readonly isLoading: boolean
  readonly isSuccess: boolean
  readonly isError: boolean
  readonly refetch: () => Promise<TData | undefined>
  readonly reset: () => void
}
