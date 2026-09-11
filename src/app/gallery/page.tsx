'use client';

import { useEffect, useState } from 'react';
import { isStoryName, stories, type StoryName } from './stories';

// 시각적 회귀용 갤러리 — Playwright가 window.mount('이름')로 story 하나만 그리게 한다.
// 여러 개를 한 화면에 늘어놓지 않는 이유: 하나가 바뀌면 전부의 기준선이 깨지고,
// 뷰포트 밖 story는 이미지 지연 로딩 때문에 안 뜬 채로 찍힌다.
//
// 크롬(SiteHeader)은 빼고 목록 화면과 같은 컨테이너(week05-page)만 두른다 —
// 폭이 다르면 5열 그리드의 칸 너비가 달라져 기준선이 실제 화면과 어긋난다.
declare global {
  interface Window {
    mount?: (name: string) => void;
  }
}

export default function GalleryPage() {
  const [name, setName] = useState<StoryName | null>(null);

  useEffect(() => {
    // 이 함수의 존재가 곧 hydration 완료 신호다. 테스트는 mount를 부르기 전에 이걸 기다린다.
    window.mount = (value) => {
      // 이름이 틀리면 조용히 빈 화면을 찍지 않고 evaluate를 실패시킨다 —
      // 빈 기준선이 통과해버리는 게 스크린샷 테스트의 가장 흔한 거짓 통과다.
      if (!isStoryName(value)) {
        throw new Error(`알 수 없는 story: ${value}`);
      }
      setName(value);
    };
    return () => {
      delete window.mount;
    };
  }, []);

  const Story = name === null ? null : stories[name];

  return (
    <div className="week05-page">
      <div id="story-root">{Story === null ? null : <Story />}</div>
    </div>
  );
}
