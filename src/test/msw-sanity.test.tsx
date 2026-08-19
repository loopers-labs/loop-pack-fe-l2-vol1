import { render, screen } from "@testing-library/react";
import { useEffect, useState } from "react";
import { describe, expect, it } from "vitest";

// 이 컴포넌트는 실제 앱 코드가 아니라, MSW가 fetch를 가로채는지만
// 확인하기 위한 0단계 sanity check 전용 컴포넌트입니다.
function SanityFetcher() {
  const [title, setTitle] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/home")
      .then((res) => res.json())
      .then((data) => setTitle(data.banner.title))
      .catch(() => setTitle("에러 발생"));
  }, []);

  return <div>{title ?? "로딩 중"}</div>;
}

describe("MSW sanity check", () => {
  it("fetch 요청을 MSW가 가로채서 지정한 응답을 반환한다", async () => {
    render(<SanityFetcher />);

    expect(await screen.findByText("sanity 배너")).toBeInTheDocument();
  });
});