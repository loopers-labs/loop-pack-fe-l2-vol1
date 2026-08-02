import { afterEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { cleanup, render, screen } from "../../mocks/render";

const { queryErrorReset } = vi.hoisted(() => ({ queryErrorReset: vi.fn() }));

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();

  return {
    ...actual,
    useQueryErrorResetBoundary: () => ({ reset: queryErrorReset }),
  };
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("app/(commerce)/error.tsx", () => {
  it("오류 fallback에서 다시 시도를 누르면 Query와 Next 경계를 각각 한 번씩 재설정한다", async () => {
    const user = userEvent.setup();
    const reset = vi.fn();
    const errorModulePath = "./error";
    const { default: CommerceError } = await import(/* @vite-ignore */ errorModulePath);

    render(<CommerceError error={new Error("상품을 불러오지 못했습니다")} reset={reset} />);

    expect(
      screen.getByRole("heading", { level: 2, name: "페이지를 불러오는데 실패했습니다" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "다시 시도" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "다시 시도" }));

    expect(queryErrorReset).toHaveBeenCalledTimes(1);
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
