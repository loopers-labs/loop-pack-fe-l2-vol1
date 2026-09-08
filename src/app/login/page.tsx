import type { JSX } from 'react'
import { LoginPage } from '@/_pages/login'

type LoginSearchParams = Record<string, string | string[] | undefined>

interface PageProps {
  searchParams: Promise<LoginSearchParams>
}

function getSingleSearchParam(
  value: string | string[] | undefined,
): string | undefined {
  return typeof value === 'string' ? value : undefined
}

export default async function Page({
  searchParams,
}: PageProps): Promise<JSX.Element> {
  const params = await searchParams

  return (
    <LoginPage
      reason={getSingleSearchParam(params.reason)}
      returnTo={getSingleSearchParam(params.returnTo)}
    />
  )
}
