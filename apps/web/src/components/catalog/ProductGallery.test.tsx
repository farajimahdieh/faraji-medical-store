import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductGallery } from "./ProductGallery";
import type { PublicProductImage } from "@/lib/api";

// next/image needs the Next.js runtime (image optimizer, etc.) that isn't
// present under jsdom — render it as a plain <img> for these tests.
vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    className,
  }: {
    src: string;
    alt: string;
    className?: string;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} />
  ),
}));

function buildImages(count: number, primaryIndex = 0): PublicProductImage[] {
  return Array.from({ length: count }, (_, i) => ({
    url: `/media/products/test/${i}.webp`,
    altText: `تصویر ${i + 1}`,
    isPrimary: i === primaryIndex,
  }));
}

describe("ProductGallery", () => {
  it("shows the primary image first", () => {
    render(
      <ProductGallery images={buildImages(3, 1)} productName="محصول تست" />,
    );
    expect(
      within(screen.getByRole("group")).getByAltText("تصویر 2"),
    ).toBeInTheDocument();
  });

  it("clicking a thumbnail changes the large image", async () => {
    const user = userEvent.setup();
    render(<ProductGallery images={buildImages(3)} productName="محصول تست" />);

    await user.click(screen.getByLabelText("نمایش تصویر 3 از 3"));

    expect(screen.getByRole("group")).toHaveAttribute(
      "aria-label",
      "تصویر 3 از 3",
    );
  });

  it("the next arrow advances to the next image", async () => {
    const user = userEvent.setup();
    render(<ProductGallery images={buildImages(3)} productName="محصول تست" />);

    await user.click(screen.getByLabelText("تصویر بعدی"));

    expect(screen.getByRole("group")).toHaveAttribute(
      "aria-label",
      "تصویر 2 از 3",
    );
  });

  it("the previous arrow goes back to the previous image", async () => {
    const user = userEvent.setup();
    render(<ProductGallery images={buildImages(3)} productName="محصول تست" />);

    await user.click(screen.getByLabelText("تصویر بعدی")); // -> 2
    await user.click(screen.getByLabelText("تصویر قبلی")); // -> 1

    expect(screen.getByRole("group")).toHaveAttribute(
      "aria-label",
      "تصویر 1 از 3",
    );
  });

  it("loops from the last image to the first on next", async () => {
    const user = userEvent.setup();
    render(<ProductGallery images={buildImages(2)} productName="محصول تست" />);

    await user.click(screen.getByLabelText("تصویر بعدی")); // -> 2/2
    await user.click(screen.getByLabelText("تصویر بعدی")); // -> loop to 1/2

    expect(screen.getByRole("group")).toHaveAttribute(
      "aria-label",
      "تصویر 1 از 2",
    );
  });

  it("loops from the first image to the last on previous", async () => {
    const user = userEvent.setup();
    render(<ProductGallery images={buildImages(3)} productName="محصول تست" />);

    await user.click(screen.getByLabelText("تصویر قبلی")); // -> loop to 3/3

    expect(screen.getByRole("group")).toHaveAttribute(
      "aria-label",
      "تصویر 3 از 3",
    );
  });

  it("marks the active thumbnail with aria-current and updates it on navigation", async () => {
    const user = userEvent.setup();
    render(<ProductGallery images={buildImages(3)} productName="محصول تست" />);

    expect(screen.getByLabelText("نمایش تصویر 1 از 3")).toHaveAttribute(
      "aria-current",
      "true",
    );
    expect(screen.getByLabelText("نمایش تصویر 2 از 3")).toHaveAttribute(
      "aria-current",
      "false",
    );

    await user.click(screen.getByLabelText("نمایش تصویر 2 از 3"));

    expect(screen.getByLabelText("نمایش تصویر 1 از 3")).toHaveAttribute(
      "aria-current",
      "false",
    );
    expect(screen.getByLabelText("نمایش تصویر 2 از 3")).toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  it("hides arrows and thumbnails entirely for a single-image product", () => {
    render(<ProductGallery images={buildImages(1)} productName="محصول تست" />);

    expect(screen.queryByLabelText("تصویر بعدی")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("تصویر قبلی")).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText("نمایش تصویر 1 از 1"),
    ).not.toBeInTheDocument();
  });

  it("shows a placeholder icon and no controls when there are no images", () => {
    const { container } = render(
      <ProductGallery images={[]} productName="محصول تست" />,
    );
    expect(screen.queryByLabelText("تصویر بعدی")).not.toBeInTheDocument();
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("keyboard ArrowLeft/ArrowRight navigate the gallery", async () => {
    const user = userEvent.setup();
    render(<ProductGallery images={buildImages(3)} productName="محصول تست" />);

    const gallery = screen.getByRole("group");
    gallery.focus();

    await user.keyboard("{ArrowLeft}");
    expect(gallery).toHaveAttribute("aria-label", "تصویر 2 از 3");

    await user.keyboard("{ArrowRight}");
    expect(gallery).toHaveAttribute("aria-label", "تصویر 1 از 3");
  });

  it("is focusable (tabIndex 0) only when there is more than one image", () => {
    const { rerender } = render(
      <ProductGallery images={buildImages(3)} productName="محصول تست" />,
    );
    expect(screen.getByRole("group")).toHaveAttribute("tabindex", "0");

    rerender(<ProductGallery images={buildImages(1)} productName="محصول تست" />);
    expect(screen.getByRole("group")).not.toHaveAttribute("tabindex");
  });
});
