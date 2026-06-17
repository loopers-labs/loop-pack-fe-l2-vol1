# TanStack Query (React Query v5) 스킬 가이드

이 프로젝트에서 서버 상태 관리는 TanStack Query를 사용한다.

## 설치 및 설정

```bash
pnpm add @tanstack/react-query
pnpm add -D @tanstack/react-query-devtools  # 선택
```

### Provider 설정 (`app/` 레이어)

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1분
      retry: 1,
    },
  },
});

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};
```

## v5 핵심 변경 사항 (v4 대비)

- 쿼리 옵션은 **단일 객체**로만 전달 (positional args 제거)
- `useQuery({ queryKey, queryFn })` 형태만 허용
- `onSuccess`, `onError`, `onSettled` 콜백 **제거** — `useEffect`나 mutation의 콜백으로 대체
- `isLoading` → 초기 로딩만, `isFetching` → 백그라운드 포함
- `status: 'loading'` → `status: 'pending'`
- `cacheTime` → `gcTime`
- 타입 추론 강화 — 제네릭 명시 거의 불필요

## FSD 구조에서의 배치

```
features/post/
├── api/
│   ├── postApi.ts        # fetch 함수
│   ├── postQueries.ts    # queryOptions, mutationOptions
│   └── types.ts          # 요청/응답 타입
├── ui/
│   └── PostList.tsx
├── model/
│   └── usePostActions.ts # mutation 래핑 훅 (필요 시)
└── index.ts
```

## 쿼리 키 컨벤션

`queryOptions` 팩토리 패턴을 사용한다.

```tsx
// features/post/api/postQueries.ts
import { queryOptions } from '@tanstack/react-query';
import { fetchPosts, fetchPostById } from './postApi';

export const postQueries = {
  all: () =>
    queryOptions({
      queryKey: ['posts'],
      queryFn: fetchPosts,
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: ['posts', id],
      queryFn: () => fetchPostById(id),
      enabled: !!id,
    }),
  list: (params: PostListParams) =>
    queryOptions({
      queryKey: ['posts', 'list', params],
      queryFn: () => fetchPosts(params),
    }),
};
```

### 사용

```tsx
import { useQuery } from '@tanstack/react-query';
import { postQueries } from '../api/postQueries';

const PostList = () => {
  const { data, isPending, error } = useQuery(postQueries.all());
  // ...
};

const PostDetail = ({ id }: { id: string }) => {
  const { data } = useQuery(postQueries.detail(id));
  // ...
};
```

## API 함수 작성 (`api/` 세그먼트)

```tsx
// features/post/api/postApi.ts
import { apiClient } from '@/shared/api/client';
import type { Post, CreatePostRequest } from './types';

export const fetchPosts = async (): Promise<Post[]> => {
  const response = await apiClient.get('/posts');
  return response.data;
};

export const createPost = async (data: CreatePostRequest): Promise<Post> => {
  const response = await apiClient.post('/posts', data);
  return response.data;
};
```

## Mutation 패턴

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPost } from '../api/postApi';

export const useCreatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};
```

### 컴포넌트에서 사용

```tsx
const CreatePostForm = () => {
  const { mutate, isPending } = useCreatePost();

  const handleSubmit = (data: CreatePostRequest) => {
    mutate(data);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* ... */}
      <button type="submit" disabled={isPending}>
        작성
      </button>
    </form>
  );
};
```

## 낙관적 업데이트 (Optimistic Update)

```tsx
useMutation({
  mutationFn: updatePost,
  onMutate: async (newPost) => {
    await queryClient.cancelQueries({ queryKey: ['posts', newPost.id] });
    const previous = queryClient.getQueryData(['posts', newPost.id]);
    queryClient.setQueryData(['posts', newPost.id], newPost);
    return { previous };
  },
  onError: (_err, _newPost, context) => {
    if (context?.previous) {
      queryClient.setQueryData(['posts', context.previous.id], context.previous);
    }
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['posts'] });
  },
});
```

## Suspense 모드

React 19의 `<Suspense>`와 함께 사용:

```tsx
import { useSuspenseQuery } from '@tanstack/react-query';

const PostList = () => {
  const { data } = useSuspenseQuery(postQueries.all());
  // data는 항상 존재 (undefined 아님)
  return (
    <ul>
      {data.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
};

// 부모에서 Suspense로 감싸기
<Suspense fallback={<Skeleton />}>
  <PostList />
</Suspense>;
```

## 무한 스크롤

```tsx
import { useInfiniteQuery } from '@tanstack/react-query';

const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
  queryKey: ['posts', 'infinite'],
  queryFn: ({ pageParam }) => fetchPosts({ cursor: pageParam }),
  initialPageParam: 0,
  getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
});
```

## 주의 사항

- `queryFn` 안에서 상태를 변경하지 않을 것 — 순수 데이터 fetch만
- `queryKey`에 의존하는 모든 변수를 포함할 것
- `enabled: false`일 때 `data`는 `undefined` — 타입 가드 필요
- DevTools는 개발 환경에서만 포함

```tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// app/providers.tsx
<QueryClientProvider client={queryClient}>
  {children}
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>;
```
