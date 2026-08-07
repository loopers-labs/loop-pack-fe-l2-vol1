import * as z from 'zod'

const INVALID_ORIGIN_MESSAGE =
  'APP_ORIGIN must be an absolute HTTP(S) origin without credentials, path, query, or hash.'

export const appOriginSchema = z
  .string()
  .refine((value) => {
    if (
      value.trim() !== value ||
      value.includes('?') ||
      value.includes('#') ||
      !URL.canParse(value)
    ) {
      return false
    }

    const url = new URL(value)
    return (
      (url.protocol === 'http:' || url.protocol === 'https:') &&
      url.username === '' &&
      url.password === '' &&
      url.pathname === '/'
    )
  }, INVALID_ORIGIN_MESSAGE)
  .transform((value) => new URL(value).origin)
  .brand<'AppOrigin'>()

export type AppOrigin = z.infer<typeof appOriginSchema>

export class AppOriginError extends Error {
  readonly name = 'AppOriginError'
}

export function parseAppOrigin(input: unknown): AppOrigin {
  if (
    input === undefined ||
    (typeof input === 'string' && input.trim() === '')
  ) {
    throw new AppOriginError('APP_ORIGIN is required.')
  }

  const result = appOriginSchema.safeParse(input)
  if (!result.success) {
    throw new AppOriginError(INVALID_ORIGIN_MESSAGE)
  }

  return result.data
}
