'use client'

import { useState } from 'react'
import { Dialog } from '@/components/ui/dialog'
import triggerStyles from './DialogDemoTrigger.module.css'
import styles from './ControlledDialogDemo.module.css'

/*
 * controlled 데모(외부 버튼으로 열기 + onOpenChange 로그)만 실제로 useState가 필요하다.
 * 페이지 전체를 'use client'로 두는 대신 이 조각만 leaf Client Component로 분리해서,
 * 나머지(제목/설명, uncontrolled 데모)는 Server Component로 남긴다.
 * 트리거 버튼 스타일은 UncontrolledDialogDemo와 완전히 같아서 DialogDemoTrigger.module.css로
 * 공유한다. eventLog는 이 컴포넌트에만 필요해서 여기 그대로 둔다.
 */
export const ControlledDialogDemo = () => {
  const [isNoticeOpen, setIsNoticeOpen] = useState(false)
  const [eventLog, setEventLog] = useState<string[]>([])

  return (
    <>
      <button
        type="button"
        className={triggerStyles.trigger}
        onClick={() => {
          setIsNoticeOpen(true)
          setEventLog((log) => [...log, '외부 버튼으로 열림 (Trigger 없이 open을 직접 true로)'])
        }}
      >
        외부에서 이벤트 팝업 열기
      </button>
      <Dialog
        open={isNoticeOpen}
        onOpenChange={(next) => {
          setIsNoticeOpen(next)
          setEventLog((log) => [...log, next ? 'onOpenChange(true)' : 'onOpenChange(false)'])
        }}
      >
        <Dialog.Overlay data-testid="controlled-overlay" />
        <Dialog.Content data-testid="controlled-content">
          <Dialog.Title>첫 구매 10% 할인</Dialog.Title>
          <Dialog.Description>
            지금 가입하면 첫 구매 10% 할인 쿠폰이 즉시 지급됩니다.
          </Dialog.Description>
          <Dialog.Close aria-label="이벤트 팝업 닫기" />
        </Dialog.Content>
      </Dialog>
      {eventLog.length > 0 && (
        <ul className={styles.eventLog} data-testid="event-log">
          {eventLog.map((entry, index) => (
            <li key={index}>{entry}</li>
          ))}
        </ul>
      )}
    </>
  )
}
