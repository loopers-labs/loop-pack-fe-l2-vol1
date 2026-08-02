import type { ImgHTMLAttributes } from 'react';

/* AI-generated : "type": "module" 환경에서 next/image의 CJS 재수출 패턴이 esbuild와 이중으로 감싸지는 문제를 피하기 위한 테스트 전용 대체 컴포넌트 */
export default function Image({ alt, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  return <img alt={alt} {...props} />;
}
