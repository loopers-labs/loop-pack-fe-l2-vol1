import type { ReactNode } from 'react';

type LineRowProps = {
  /** 왼쪽에 표시할 썸네일(이모지 등) */
  thumbnail?: string;
  /** 가운데 영역에 렌더링할 콘텐츠 */
  children: ReactNode;
  /** 오른쪽 끝에 렌더링할 콘텐츠 (금액, 태그 등) */
  rightSlot?: ReactNode;
};

export function LineRow({ thumbnail, children, rightSlot }: LineRowProps) {
  return (
    <div className="line">
      {thumbnail ? <span className="thumb">{thumbnail}</span> : null}
      <div className="grow">{children}</div>
      {rightSlot && rightSlot}
    </div>
  );
}
