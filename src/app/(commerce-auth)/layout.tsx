import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { cookies } from "next/headers";
import { getQueryClient } from "@/_app/config/getQueryClient";
import { readSessionToken } from "@/app/api/_data/auth";
import { SESSION_COOKIE } from "@/app/api/_data/auth-cookies";
import { sessionQueries } from "@/entities/session";
import { CommerceHeader } from "@/widgets/header";

export default async function CommerceAuthLayout({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  const cookieStore = await cookies();
  const user = readSessionToken(cookieStore.get(SESSION_COOKIE)?.value);

  queryClient.setQueryData(sessionQueries.me().queryKey, { user });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="mx-auto w-full max-w-[1200px] px-4 py-5 pb-16 sm:px-6 lg:px-8">
        <CommerceHeader />
        <main>{children}</main>
      </div>
    </HydrationBoundary>
  );
}
