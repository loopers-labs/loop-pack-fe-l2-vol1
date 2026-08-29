'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import { createStore, useStore } from 'zustand';

import type { SessionUser } from './types';

type SessionState = {
  user: SessionUser | null;
  actions: {
    setUser: (user: SessionUser) => void;
    clearUser: () => void;
  };
};

/**
 * 모듈 전역 store는 서버에서 요청 간 사용자가 섞일 수 있어 Provider마다 새로 만든다.
 * 서버 데이터 캐시가 아니라 로그인·로그아웃·만료에서만 바뀌는 UI 복사본이므로 persist나 재조회는 두지 않는다.
 */
const createSessionStore = (initialUser: SessionUser | null) =>
  createStore<SessionState>()((set) => ({
    user: initialUser,
    actions: {
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
    },
  }));

type SessionStore = ReturnType<typeof createSessionStore>;

const SessionStoreContext = createContext<SessionStore | null>(null);

export function SessionProvider({
  initialUser,
  children,
}: {
  initialUser: SessionUser | null;
  children: ReactNode;
}) {
  const [store] = useState(() => createSessionStore(initialUser));

  return (
    <SessionStoreContext.Provider value={store}>
      {children}
    </SessionStoreContext.Provider>
  );
}

const useSessionStore = () => {
  const store = useContext(SessionStoreContext);

  if (!store) {
    throw new Error('SessionProvider 안에서만 사용할 수 있습니다.');
  }

  return store;
};

export const useSessionUser = () =>
  useStore(useSessionStore(), (state) => state.user);

export const useSessionActions = () =>
  useStore(useSessionStore(), (state) => state.actions);
