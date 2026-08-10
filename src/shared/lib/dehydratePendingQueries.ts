import {
  defaultShouldDehydrateQuery,
  dehydrate,
  type DehydratedState,
  type QueryClient,
} from '@tanstack/react-query'

class PendingQueryDehydration {
  private constructor() {}

  static dehydrate(queryClient: QueryClient): DehydratedState {
    return dehydrate(queryClient, {
      shouldDehydrateQuery: (query) =>
        defaultShouldDehydrateQuery(query) || query.state.status === 'pending',
      shouldRedactErrors: () => true,
    })
  }
}

export const dehydratePendingQueries = PendingQueryDehydration.dehydrate.bind(
  PendingQueryDehydration,
)
