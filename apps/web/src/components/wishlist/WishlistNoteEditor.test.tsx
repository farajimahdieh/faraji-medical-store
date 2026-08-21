import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToastProvider } from "@/components/toast/ToastProvider";
import { WishlistNoteEditor } from "./WishlistNoteEditor";
import * as api from "@/lib/api";
import type { PublicWishlistItem } from "@/lib/api";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof api>("@/lib/api");
  return { ...actual, updateWishlistNote: vi.fn() };
});

function buildItem(note: string | null): PublicWishlistItem {
  return {
    wishlistItemId: "w1",
    productId: "p1",
    productName: "کمربند طبی",
    productSlug: "lumbar-belt",
    brand: null,
    primaryImage: null,
    variantId: null,
    size: null,
    price: { status: "unavailable", minPrice: null, maxPrice: null },
    stockStatus: "unknown",
    note,
    createdAt: new Date().toISOString(),
  };
}

function renderEditor(note: string | null, onChange = vi.fn()) {
  render(
    <ToastProvider>
      <WishlistNoteEditor wishlistItemId="w1" note={note} onChange={onChange} />
    </ToastProvider>,
  );
  return { onChange };
}

describe("WishlistNoteEditor", () => {
  beforeEach(() => {
    vi.mocked(api.updateWishlistNote).mockReset();
  });

  it("shows an 'add note' button when there is no note yet", () => {
    renderEditor(null);
    expect(screen.getByRole("button", { name: "افزودن یادداشت" })).toBeInTheDocument();
  });

  it("adds a note and reports it back through onChange", async () => {
    const user = userEvent.setup();
    vi.mocked(api.updateWishlistNote).mockResolvedValue(buildItem("برای مشورت با پزشک ذخیره کردم"));
    const { onChange } = renderEditor(null);

    await user.click(screen.getByRole("button", { name: "افزودن یادداشت" }));
    await user.type(
      screen.getByPlaceholderText("مثلاً: برای مشورت با پزشک ذخیره کردم..."),
      "برای مشورت با پزشک ذخیره کردم",
    );
    await user.click(screen.getByRole("button", { name: "ذخیره یادداشت" }));

    await waitFor(() =>
      expect(api.updateWishlistNote).toHaveBeenCalledWith("w1", "برای مشورت با پزشک ذخیره کردم"),
    );
    expect(onChange).toHaveBeenCalledWith("برای مشورت با پزشک ذخیره کردم");
  });

  it("inserts an example into the draft without saving it automatically", async () => {
    const user = userEvent.setup();
    renderEditor(null);
    await user.click(screen.getByRole("button", { name: "افزودن یادداشت" }));

    await user.click(screen.getByRole("button", { name: "برای مشورت با پزشک" }));

    expect(
      screen.getByPlaceholderText("مثلاً: برای مشورت با پزشک ذخیره کردم..."),
    ).toHaveValue("برای مشورت با پزشک");
    expect(api.updateWishlistNote).not.toHaveBeenCalled();
  });

  it("edits an existing note", async () => {
    const user = userEvent.setup();
    vi.mocked(api.updateWishlistNote).mockResolvedValue(buildItem("مقایسه با مدل دیگر"));
    const { onChange } = renderEditor("یادداشت قبلی");

    await user.click(screen.getByRole("button", { name: "ویرایش یادداشت" }));
    const textarea = screen.getByDisplayValue("یادداشت قبلی");
    await user.clear(textarea);
    await user.type(textarea, "مقایسه با مدل دیگر");
    await user.click(screen.getByRole("button", { name: "ذخیره یادداشت" }));

    await waitFor(() =>
      expect(api.updateWishlistNote).toHaveBeenCalledWith("w1", "مقایسه با مدل دیگر"),
    );
    expect(onChange).toHaveBeenCalledWith("مقایسه با مدل دیگر");
  });

  it("deletes a note by saving it as null", async () => {
    const user = userEvent.setup();
    vi.mocked(api.updateWishlistNote).mockResolvedValue(buildItem(null));
    const { onChange } = renderEditor("یادداشت قبلی");

    await user.click(screen.getByRole("button", { name: "حذف یادداشت" }));

    await waitFor(() => expect(api.updateWishlistNote).toHaveBeenCalledWith("w1", null));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("shows an error toast and keeps the note unchanged when saving fails", async () => {
    const user = userEvent.setup();
    vi.mocked(api.updateWishlistNote).mockRejectedValue(new Error("boom"));
    const { onChange } = renderEditor(null);

    await user.click(screen.getByRole("button", { name: "افزودن یادداشت" }));
    await user.type(
      screen.getByPlaceholderText("مثلاً: برای مشورت با پزشک ذخیره کردم..."),
      "یادداشت جدید",
    );
    await user.click(screen.getByRole("button", { name: "ذخیره یادداشت" }));

    expect(
      await screen.findByText("ذخیره یادداشت انجام نشد، دوباره تلاش کنید"),
    ).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });
});
