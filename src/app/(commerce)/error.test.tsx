import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import CommerceRouteError from "./error";

describe("CommerceRouteError", () => {
  it("예상하지 못한 라우트 오류 fallback과 reset 버튼을 렌더링한다", async () => {
    const reset = vi.fn();

    render(<CommerceRouteError error={new Error("렌더링 오류가 발생했습니다.")} reset={reset} />);

    expect(
      screen.getByRole("heading", { name: "화면을 불러오지 못했습니다." }),
    ).toBeInTheDocument();
    expect(screen.getByText("렌더링 오류가 발생했습니다.")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "다시 시도" }));

    expect(reset).toHaveBeenCalledTimes(1);
  });
});
