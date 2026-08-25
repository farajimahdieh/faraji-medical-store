import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CartPopover } from "./CartPopover";

describe("CartPopover", () => {
  it("always shows the honest empty state -- no fake items or count", () => {
    render(<CartPopover />);

    const trigger = screen.getByRole("link", { name: "سبد خرید" });
    fireEvent.focus(trigger);

    expect(screen.getByText("سبد خرید شما")).toBeInTheDocument();
    expect(
      screen.getByText("محصولاتی که برای خرید انتخاب می‌کنید اینجا نگه داشته می‌شوند."),
    ).toBeInTheDocument();
    // No badge on the trigger -- there's no real count to show.
    expect(trigger.querySelector("span")).not.toBeInTheDocument();
  });
});
