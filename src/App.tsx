import { ModalProvider } from '@ilokesto/modal'

import { ProductListPage } from './pages/product-list'

export function App() {
  return (
    <ModalProvider>
      <ProductListPage />
    </ModalProvider>
  )
}
