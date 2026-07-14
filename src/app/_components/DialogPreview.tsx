import { UncontrolledDialogDemo } from './UncontrolledDialogDemo'
import { ControlledDialogDemo } from './ControlledDialogDemo'
import { PreviewCard } from './PreviewCard'
export const DialogPreview = () => (
  <>
    <PreviewCard title="Dialog (uncontrolled)" description="Trigger + 내부 state로 열고 닫기">
      <UncontrolledDialogDemo />
    </PreviewCard>
    <PreviewCard title="Dialog (controlled)" description="open·onOpenChange를 부모가 소유">
      <ControlledDialogDemo />
    </PreviewCard>
  </>
)
