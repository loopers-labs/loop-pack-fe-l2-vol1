"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AuthRequiredError } from "@/shared/api/AuthRequiredError";

const hasAuthRequiredError = (error: unknown) => error instanceof AuthRequiredError;

export function AuthRequiredModalBoundary({ initiallyOpen }: { initiallyOpen: boolean }) {
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(initiallyOpen);
  const redirectTo = useMemo(() => {
    const search = searchParams.toString();
    return search === "" ? pathname : `${pathname}?${search}`;
  }, [pathname, searchParams]);

  useEffect(() => {
    const openWhenAuthRequired = () => {
      const queryHasAuthError = queryClient
        .getQueryCache()
        .findAll()
        .some((query) => hasAuthRequiredError(query.state.error));
      const mutationHasAuthError = queryClient
        .getMutationCache()
        .findAll()
        .some((mutation) => hasAuthRequiredError(mutation.state.error));

      if (queryHasAuthError || mutationHasAuthError) {
        setIsOpen(true);
      }
    };

    const unsubscribeQueryCache = queryClient.getQueryCache().subscribe(openWhenAuthRequired);
    const unsubscribeMutationCache = queryClient.getMutationCache().subscribe(openWhenAuthRequired);

    openWhenAuthRequired();

    return () => {
      unsubscribeQueryCache();
      unsubscribeMutationCache();
    };
  }, [queryClient]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 px-4">
      <div
        className="grid w-full max-w-sm gap-4 rounded-gds-lg bg-white p-5 shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-required-title"
      >
        <div className="grid gap-2">
          <h2 id="auth-required-title" className="text-lg font-bold text-gds-gray-900">
            세션 만료
          </h2>
          <p className="text-sm leading-6 text-gds-gray-700">
            세션이 만료되었습니다. 다시 로그인해주세요.
          </p>
        </div>
        <Link
          className="inline-flex min-h-10 items-center justify-center rounded-gds-sm border border-gds-green-500 bg-gds-green-500 px-4 py-2 text-sm font-semibold text-white hover:bg-gds-green-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gds-green-500"
          href={`/login?redirectTo=${encodeURIComponent(redirectTo)}`}
        >
          로그인하기
        </Link>
      </div>
    </div>
  );
}
