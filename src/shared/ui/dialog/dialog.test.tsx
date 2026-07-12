import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToStaticMarkup } from "react-dom/server";
import { Dialog } from "./dialog";

afterEach(cleanup);

describe("Dialog", () => {
  it("Dialog 루트 밖에서 조각을 렌더하면 에러를 던진다", () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<Dialog.Trigger>열기</Dialog.Trigger>)).toThrow(
      "Dialog.Trigger must be used within <Dialog>",
    );
    expect(() => render(<Dialog.Overlay />)).toThrow("Dialog.Overlay must be used within <Dialog>");
    expect(() => render(<Dialog.Content>내용</Dialog.Content>)).toThrow(
      "Dialog.Content must be used within <Dialog>",
    );
    expect(() => render(<Dialog.Title>제목</Dialog.Title>)).toThrow(
      "Dialog.Title must be used within <Dialog>",
    );
    expect(() => render(<Dialog.Description>설명</Dialog.Description>)).toThrow(
      "Dialog.Description must be used within <Dialog>",
    );
    expect(() => render(<Dialog.Close>닫기</Dialog.Close>)).toThrow(
      "Dialog.Close must be used within <Dialog>",
    );

    consoleErrorSpy.mockRestore();
  });

  it("uncontrolled 모드에서 Trigger 클릭으로 열리고 Close 클릭으로 닫힌다", async () => {
    const user = userEvent.setup();
    const handleOpenChange = vi.fn();

    render(
      <Dialog onOpenChange={handleOpenChange}>
        <Dialog.Trigger>열기</Dialog.Trigger>
        <Dialog.Overlay />
        <Dialog.Content>
          <Dialog.Title>제목</Dialog.Title>
          <Dialog.Close>닫기</Dialog.Close>
        </Dialog.Content>
      </Dialog>,
    );

    expect(screen.queryByText("제목")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "열기" }));

    expect(screen.getByText("제목")).toBeInTheDocument();
    expect(handleOpenChange).toHaveBeenCalledWith(true);

    await user.click(screen.getByRole("button", { name: "닫기" }));

    expect(screen.queryByText("제목")).not.toBeInTheDocument();
    expect(handleOpenChange).toHaveBeenCalledWith(false);
  });

  it("controlled 모드에서는 open이 고정되어 있으면 내부적으로 닫히지 않고 onOpenChange만 호출된다", async () => {
    const user = userEvent.setup();
    const handleOpenChange = vi.fn();

    render(
      <Dialog open onOpenChange={handleOpenChange}>
        <Dialog.Trigger>열기</Dialog.Trigger>
        <Dialog.Content>
          <Dialog.Title>제목</Dialog.Title>
        </Dialog.Content>
      </Dialog>,
    );

    expect(screen.getByText("제목")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "열기" }));

    // controlled라 open prop이 그대로 true로 고정 — 내부적으로 닫히지 않는다
    expect(screen.getByText("제목")).toBeInTheDocument();
    expect(handleOpenChange).toHaveBeenCalledWith(false);
  });

  it("열린 Content와 Overlay는 document.body에 포탈된다", () => {
    render(
      <Dialog open>
        <Dialog.Overlay />
        <Dialog.Content>내용</Dialog.Content>
      </Dialog>,
    );

    expect(screen.getByText("내용").parentElement).toBe(document.body);
    expect(screen.getByTestId("dialog-overlay").parentElement).toBe(document.body);
  });

  it("SSR 렌더에서 document 접근으로 throw하지 않는다", () => {
    expect(() =>
      renderToStaticMarkup(
        <Dialog open>
          <Dialog.Overlay />
          <Dialog.Content>내용</Dialog.Content>
        </Dialog>,
      ),
    ).not.toThrow();
  });

  it("열리면 body 스크롤을 잠그고 닫히면 원래 값으로 되돌린다", () => {
    document.body.style.overflow = "auto";

    const { rerender } = render(
      <Dialog open={false}>
        <Dialog.Content>내용</Dialog.Content>
      </Dialog>,
    );

    expect(document.body.style.overflow).toBe("auto");

    rerender(
      <Dialog open>
        <Dialog.Content>내용</Dialog.Content>
      </Dialog>,
    );

    expect(document.body.style.overflow).toBe("hidden");

    rerender(
      <Dialog open={false}>
        <Dialog.Content>내용</Dialog.Content>
      </Dialog>,
    );

    expect(document.body.style.overflow).toBe("auto");
  });

  it("Esc 키를 누르면 닫히고 onOpenChange(false)가 호출된다", () => {
    const handleOpenChange = vi.fn();

    render(
      <Dialog open onOpenChange={handleOpenChange}>
        <Dialog.Overlay />
        <Dialog.Content>내용</Dialog.Content>
      </Dialog>,
    );

    fireEvent.keyDown(document, { key: "Escape" });

    expect(handleOpenChange).toHaveBeenCalledWith(false);
  });

  it("Overlay를 클릭하면 닫히고 onOpenChange(false)가 호출된다", async () => {
    const user = userEvent.setup();
    const handleOpenChange = vi.fn();

    render(
      <Dialog open onOpenChange={handleOpenChange}>
        <Dialog.Overlay />
        <Dialog.Content>내용</Dialog.Content>
      </Dialog>,
    );

    await user.click(screen.getByTestId("dialog-overlay"));

    expect(handleOpenChange).toHaveBeenCalledWith(false);
  });

  it("Content 내부를 클릭해도 닫히지 않는다", async () => {
    const user = userEvent.setup();
    const handleOpenChange = vi.fn();

    render(
      <Dialog open onOpenChange={handleOpenChange}>
        <Dialog.Overlay />
        <Dialog.Content>
          <Dialog.Title>제목</Dialog.Title>
        </Dialog.Content>
      </Dialog>,
    );

    await user.click(screen.getByText("제목"));

    expect(handleOpenChange).not.toHaveBeenCalled();
  });
});
