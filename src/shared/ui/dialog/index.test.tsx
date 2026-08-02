import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { Dialog } from './index'

// 공개 API로만 검증한다. 스크롤 잠금은 모듈 싱글턴(참조 카운트)이라
// 각 테스트가 닫기/unmount로 카운트를 0으로 되돌려 누수를 남기지 않는다.

function UncontrolledDialog({
  name = '안내',
  defaultOpen = false,
}: {
  name?: string
  defaultOpen?: boolean
}) {
  return (
    <Dialog defaultOpen={defaultOpen}>
      <Dialog.Trigger>{name} 열기</Dialog.Trigger>
      <Dialog.Overlay data-testid={`overlay-${name}`} />
      <Dialog.Content data-testid={`content-${name}`}>
        <Dialog.Title>{name}</Dialog.Title>
        <Dialog.Description>{name} 설명</Dialog.Description>
        <Dialog.Close>{name} 닫기</Dialog.Close>
      </Dialog.Content>
    </Dialog>
  )
}

describe('Dialog — uncontrolled', () => {
  it('Trigger로 열리고 Close로 닫힌다', () => {
    render(<UncontrolledDialog />)
    expect(screen.queryByTestId('content-안내')).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('안내 열기'))
    expect(screen.getByTestId('content-안내')).toBeInTheDocument()
    fireEvent.click(screen.getByText('안내 닫기'))
    expect(screen.queryByTestId('content-안내')).not.toBeInTheDocument()
  })

  it('defaultOpen이면 마운트 직후 열려 있다', () => {
    render(<UncontrolledDialog defaultOpen />)
    expect(screen.getByTestId('content-안내')).toBeInTheDocument()
  })

  it('Content는 body로 Portal 렌더된다', () => {
    const { container } = render(<UncontrolledDialog defaultOpen />)
    const content = screen.getByTestId('content-안내')
    expect(container.contains(content)).toBe(false) // 렌더 트리 밖
    expect(document.body.contains(content)).toBe(true)
  })

  it('오버레이 클릭으로 닫히고, Content 클릭으로는 닫히지 않는다', () => {
    render(<UncontrolledDialog defaultOpen />)
    fireEvent.click(screen.getByTestId('content-안내'))
    expect(screen.getByTestId('content-안내')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('overlay-안내'))
    expect(screen.queryByTestId('content-안내')).not.toBeInTheDocument()
  })

  it('Esc로 닫힌다', () => {
    render(<UncontrolledDialog defaultOpen />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByTestId('content-안내')).not.toBeInTheDocument()
  })

  it('IME 조합 중 Esc(isComposing)로는 닫히지 않는다', () => {
    render(<UncontrolledDialog defaultOpen />)
    fireEvent.keyDown(document, { key: 'Escape', isComposing: true })
    expect(screen.getByTestId('content-안내')).toBeInTheDocument()
  })
})

describe('Dialog — controlled (이중 API)', () => {
  function ControlledHarness({
    onOpenChange,
  }: {
    onOpenChange?: (open: boolean) => void
  }) {
    const [open, setOpen] = useState(false)
    return (
      <>
        <button type="button" onClick={() => setOpen(true)}>
          밖에서 열기
        </button>
        <output data-testid="parent-open">{String(open)}</output>
        <Dialog
          open={open}
          onOpenChange={(next) => {
            onOpenChange?.(next)
            setOpen(next)
          }}
        >
          <Dialog.Overlay data-testid="overlay-controlled" />
          <Dialog.Content data-testid="content-controlled">
            <Dialog.Close>닫기</Dialog.Close>
          </Dialog.Content>
        </Dialog>
      </>
    )
  }

  it('열림 상태의 진실이 부모에 있다 — Esc·Close 모두 onOpenChange를 거쳐 닫힌다', () => {
    const onOpenChange = vi.fn()
    render(<ControlledHarness onOpenChange={onOpenChange} />)
    fireEvent.click(screen.getByText('밖에서 열기'))
    expect(screen.getByTestId('content-controlled')).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
    expect(screen.getByTestId('parent-open')).toHaveTextContent('false')
    expect(screen.queryByTestId('content-controlled')).not.toBeInTheDocument()
  })

  it('부모가 통지를 무시하면 닫히지 않는다 — 내부 상태를 만들지 않는다는 증거', () => {
    render(
      <Dialog open onOpenChange={() => undefined}>
        <Dialog.Content data-testid="ignored-close">
          <Dialog.Close>닫기</Dialog.Close>
        </Dialog.Content>
      </Dialog>,
    )
    fireEvent.click(screen.getByText('닫기'))
    // onOpenChange가 상태를 안 바꿨으므로 그대로 열려 있어야 한다.
    expect(screen.getByTestId('ignored-close')).toBeInTheDocument()
  })
})

describe('Dialog — 합성 핸들러 계약 (preventDefault 거부권)', () => {
  it('Trigger onClick이 preventDefault하면 열리지 않는다', () => {
    render(
      <Dialog>
        <Dialog.Trigger onClick={(event) => event.preventDefault()}>
          열기
        </Dialog.Trigger>
        <Dialog.Content data-testid="vetoed">내용</Dialog.Content>
      </Dialog>,
    )
    fireEvent.click(screen.getByText('열기'))
    expect(screen.queryByTestId('vetoed')).not.toBeInTheDocument()
  })

  it('Close onClick이 preventDefault하면 닫히지 않는다 — 미저장 폼 보호', () => {
    render(
      <Dialog defaultOpen>
        <Dialog.Content data-testid="dirty-form">
          <Dialog.Close onClick={(event) => event.preventDefault()}>
            닫기
          </Dialog.Close>
        </Dialog.Content>
      </Dialog>,
    )
    fireEvent.click(screen.getByText('닫기'))
    expect(screen.getByTestId('dirty-form')).toBeInTheDocument()
  })
})

describe('Dialog — 겹침 장애 시나리오', () => {
  it('Esc는 최상단(나중에 열린) 다이얼로그만 닫는다', () => {
    render(
      <>
        <UncontrolledDialog name="아래" defaultOpen />
        <UncontrolledDialog name="위" defaultOpen />
      </>,
    )
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.getByTestId('content-아래')).toBeInTheDocument()
    expect(screen.queryByTestId('content-위')).not.toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByTestId('content-아래')).not.toBeInTheDocument()
  })

  it('스크롤 잠금: 하나 닫혀도 남은 다이얼로그가 잠금을 유지하고, 모두 닫히면 원복된다', () => {
    document.body.style.overflow = 'auto' // 사용처가 이미 지정한 값도 복원돼야 한다
    render(
      <>
        <UncontrolledDialog name="아래" defaultOpen />
        <UncontrolledDialog name="위" defaultOpen />
      </>,
    )
    expect(document.body.style.overflow).toBe('hidden')

    fireEvent.click(screen.getByText('위 닫기')) // 하나만 닫음
    expect(document.body.style.overflow).toBe('hidden') // 여전히 잠김

    fireEvent.click(screen.getByText('아래 닫기')) // 마지막까지 닫음
    expect(document.body.style.overflow).toBe('auto') // 원래 값 복원
    document.body.style.overflow = ''
  })

  it('unmount로 닫혀도 잠금이 해제된다 — 카운트 누수 없음', () => {
    const { unmount } = render(<UncontrolledDialog defaultOpen />)
    expect(document.body.style.overflow).toBe('hidden')
    unmount()
    expect(document.body.style.overflow).toBe('')
  })
})

describe('Dialog — 오사용 가드', () => {
  it('Dialog 밖에서 조각을 쓰면 명시적으로 throw한다', () => {
    // React가 render 에러를 console.error로도 찍는다 — 테스트 출력만 조용히 한다.
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
    expect(() => render(<Dialog.Close>닫기</Dialog.Close>)).toThrow(
      /<Dialog.Close>은 <Dialog> 안에서만/,
    )
    consoleError.mockRestore()
  })
})
