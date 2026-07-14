'use client'

import { Dialog } from '@/components/ui/dialog'
import styles from './DialogDemoTrigger.module.css'

/*
 * Dialog는 Object.assign으로 Trigger/Overlay/Content 등을 합성한 compound 컴포넌트다 —
 * 이런 런타임 프로퍼티는 Server Component가 client 모듈을 "client reference"로만 건네받을 때
 * 따라오지 않는다(Dialog.Trigger가 undefined가 되어 렌더 에러가 남). Dialog.Trigger 같은
 * 서브 프로퍼티에 JSX로 접근하는 코드는 반드시 client 모듈 그래프 안에서만 써야 해서,
 * uncontrolled 데모는 상태가 없어도 이 leaf로 분리해뒀다.
 * 트리거 버튼 스타일은 ControlledDialogDemo와 완전히 같아서 DialogDemoTrigger.module.css로
 * 공유한다 — eventLog처럼 이쪽에만 필요한 스타일은 각자 파일에 남겨둔다.
 */
export const UncontrolledDialogDemo = () => (
  <Dialog>
    <Dialog.Trigger className={styles.trigger}>이용 안내 보기</Dialog.Trigger>
    <Dialog.Overlay data-testid="uncontrolled-overlay" />
    <Dialog.Content data-testid="uncontrolled-content">
      <Dialog.Title>이용 안내</Dialog.Title>
      <Dialog.Description>체크아웃 전에 배송/교환 정책을 확인해 주세요.</Dialog.Description>
      <Dialog.Close aria-label="이용 안내 닫기" />
    </Dialog.Content>
  </Dialog>
)
