import { PluginManager } from '@ilokesto/utilinent'

import { Button } from '@/shared/ui'

PluginManager.register({
  show: {
    Button,
  },
})

declare module '@ilokesto/utilinent' {
  interface UtilinentRegister {
    show: {
      Button: typeof Button
    }
  }
}
