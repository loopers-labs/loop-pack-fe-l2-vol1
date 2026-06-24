import { SectionContainer } from './container';

export const TermsSection = ({
  agreed,
  onToggleCheckbox,
  onButtonClick,
}: {
  agreed: boolean;
  onToggleCheckbox: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onButtonClick: () => void;
}) => {
  return (
    <SectionContainer>
      <label>
        <input type="checkbox" checked={agreed} onChange={onToggleCheckbox} />
        주문 내용 및 약관에 동의합니다
      </label>
      <button className="link" onClick={onButtonClick}>
        약관 보기
      </button>
    </SectionContainer>
  );
};
