import SizeSelect from './_components/SizeSelect'
import ProductOptionSelect from './_components/ProductOptionSelect'
import BundleOptionSelect from './_components/BundleOptionSelect'
import DialogShowcase from './_components/DialogShowcase'

export default function Home() {
  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: '48px 24px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
        Commerce
      </h1>
      <p style={{ color: '#5a6675', lineHeight: 1.7, marginBottom: 32 }}>
        4주차 — 같은 <code>useSelect</code> 로직 한 벌로 서로 다른 옵션 UI 3종을
        렌더한다. 품절 옵션은 키보드 이동(↑↓)에서 건너뛴다.
      </p>

      <section style={{ display: 'grid', gap: 28 }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>
            1. 사이즈 선택 — mock API 재고 연동
          </h2>
          <SizeSelect />
        </div>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>
            2. 상품 옵션 — 썸네일·할인가
          </h2>
          <ProductOptionSelect />
        </div>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>
            3. 묶음 옵션 — 개당가·무료배송 계산
          </h2>
          <BundleOptionSelect />
        </div>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>
            4. Dialog — compound + controlled/uncontrolled 이중 API
          </h2>
          <DialogShowcase />
        </div>
      </section>
    </main>
  )
}
