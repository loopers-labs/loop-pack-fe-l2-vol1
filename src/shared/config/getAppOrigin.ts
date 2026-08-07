import 'server-only'

import { parseAppOrigin } from '@/shared/config/AppOrigin'

export function getAppOrigin() {
  return parseAppOrigin(process.env.APP_ORIGIN ?? 'http://127.0.0.1:3000')
}
