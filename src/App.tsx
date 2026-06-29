import { ModalProvider } from '@ilokesto/modal'

import { CheckoutPage } from '@/pages/market'

export function App() {
  return (
    <ModalProvider>
      <CheckoutPage />
    </ModalProvider>
  )
}
