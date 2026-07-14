'use client'

import { useState } from 'react'

import { Dialog } from '@/shared/ui/dialog'

import {
  closeClassName,
  contentClassName,
  overlayClassName,
  sectionClassName,
  triggerClassName,
} from './dialog-demos/styles'

export function DialogDemos() {
  const [controlledOpen, setControlledOpen] = useState(false)

  return (
    <section className={sectionClassName}>
      <div className="mb-4">
        <h2 className="text-base font-bold text-[var(--color-ink)]">
          Dialog 예시
        </h2>
        <p className="mt-1 text-sm leading-6 break-keep text-[var(--color-muted)]">
          Dialog가 관리하는 내부 상태와 부모가 소유하는 제어 상태를 비교합니다.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Dialog>
          <Dialog.Trigger
            className={triggerClassName}
            data-testid="dialog-uncontrolled-trigger"
          >
            비제어 Dialog 열기
          </Dialog.Trigger>
          <Dialog.Overlay
            className={overlayClassName}
            data-testid="dialog-uncontrolled-overlay"
          >
            <span className="sr-only">비제어 다이얼로그 닫기</span>
          </Dialog.Overlay>
          <Dialog.Content
            className={contentClassName}
            data-testid="dialog-uncontrolled-content"
          >
            <Dialog.Title className="text-base font-bold text-[var(--color-ink)]">
              비제어 Dialog
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm leading-6 break-keep text-[var(--color-muted)]">
              open이 없으면 Dialog가 내부 상태를 관리합니다.
            </Dialog.Description>
            <Dialog.Close
              className={`${closeClassName} mt-6`}
              data-testid="dialog-uncontrolled-close"
            >
              닫기
            </Dialog.Close>
          </Dialog.Content>
        </Dialog>

        <Dialog open={controlledOpen} onOpenChange={setControlledOpen}>
          <Dialog.Trigger
            className={triggerClassName}
            data-testid="dialog-controlled-trigger"
          >
            제어 Dialog 열기
          </Dialog.Trigger>
          <Dialog.Overlay
            className={overlayClassName}
            data-testid="dialog-controlled-overlay"
          >
            <span className="sr-only">제어 다이얼로그 닫기</span>
          </Dialog.Overlay>
          <Dialog.Content
            className={contentClassName}
            data-testid="dialog-controlled-content"
          >
            <Dialog.Title className="text-base font-bold text-[var(--color-ink)]">
              제어 Dialog
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm leading-6 break-keep text-[var(--color-muted)]">
              onOpenChange 요청을 받은 부모가 open 값을 갱신합니다.
            </Dialog.Description>
            <Dialog.Close
              className={`${closeClassName} mt-6`}
              data-testid="dialog-controlled-close"
            >
              닫기
            </Dialog.Close>
          </Dialog.Content>
        </Dialog>
      </div>
    </section>
  )
}
