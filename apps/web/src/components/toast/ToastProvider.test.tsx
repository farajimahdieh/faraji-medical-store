import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { ToastProvider, useToast } from "./ToastProvider";

function Trigger() {
  const { showToast } = useToast();
  return (
    <div>
      <button onClick={() => showToast("پیام اول", { variant: "success", duration: 500 })}>
        first
      </button>
      <button onClick={() => showToast("پیام دوم", { variant: "error", duration: 500 })}>
        second
      </button>
    </div>
  );
}

describe("ToastProvider", () => {
  it("auto-dismisses after its duration", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );

    screen.getByText("first").click();
    await waitFor(() => expect(screen.getByText("پیام اول")).toBeInTheDocument());

    vi.advanceTimersByTime(3000);
    await waitFor(() => expect(screen.queryByText("پیام اول")).not.toBeInTheDocument());
    vi.useRealTimers();
  });

  it("replaces an already-visible toast instead of stacking a second one", async () => {
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );

    screen.getByText("first").click();
    await waitFor(() => expect(screen.getByText("پیام اول")).toBeInTheDocument());

    screen.getByText("second").click();
    await waitFor(() => expect(screen.getByText("پیام دوم")).toBeInTheDocument());
    expect(screen.queryByText("پیام اول")).not.toBeInTheDocument();
    // Only one status region, holding only the latest message.
    expect(screen.getAllByRole("status")).toHaveLength(1);
  });
});
