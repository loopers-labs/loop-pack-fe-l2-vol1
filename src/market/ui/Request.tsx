import { DeliveryMemo } from './DeliveryMemo';
import { SectionContainer } from '../shared/ui/container';

// 요청사항 섹션 별도로 분리(추후 기능 추가 가능)
export const Request = () => {
  return (
    <SectionContainer title="배송 요청사항">
      <DeliveryMemo />
    </SectionContainer>
  );
};
