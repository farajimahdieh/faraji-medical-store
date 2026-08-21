"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";
import { mediaUrl, type PublicProductImage } from "@/lib/api";

const SWIPE_THRESHOLD_PX = 40;

export function ProductGallery({
  images,
  productName,
}: {
  images: PublicProductImage[];
  productName: string;
}) {
  const initialIndex = Math.max(
    0,
    images.findIndex((image) => image.isPrimary),
  );
  const [index, setIndex] = useState(initialIndex);
  const touchStartX = useRef<number | null>(null);

  const count = images.length;
  const hasMultiple = count > 1;

  const goNext = useCallback(() => {
    setIndex((current) => (current + 1) % count);
  }, [count]);

  const goPrev = useCallback(() => {
    setIndex((current) => (current - 1 + count) % count);
  }, [count]);

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goNext();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      goPrev();
    }
  }

  function handleTouchStart(event: React.TouchEvent) {
    touchStartX.current = event.touches[0].clientX;
  }

  function handleTouchEnd(event: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const delta = event.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;

    if (delta <= -SWIPE_THRESHOLD_PX) goNext();
    else if (delta >= SWIPE_THRESHOLD_PX) goPrev();
  }

  if (count === 0) {
    return (
      <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-medical-bg">
        <ImageIcon className="h-16 w-16 text-primary/40" aria-hidden="true" />
      </div>
    );
  }

  const current = images[index];

  return (
    <div className="flex flex-col gap-3">
      <div
        className="relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-medical-bg outline-none"
        tabIndex={hasMultiple ? 0 : undefined}
        onKeyDown={hasMultiple ? handleKeyDown : undefined}
        onTouchStart={hasMultiple ? handleTouchStart : undefined}
        onTouchEnd={hasMultiple ? handleTouchEnd : undefined}
        role="group"
        aria-roledescription="گالری تصاویر محصول"
        aria-label={
          hasMultiple ? `تصویر ${index + 1} از ${count}` : undefined
        }
      >
        <Image
          key={current.url}
          src={mediaUrl(current.url)}
          alt={current.altText ?? productName}
          fill
          priority={index === 0}
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-contain p-6"
        />

        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={goPrev}
              aria-label="تصویر قبلی"
              className="absolute start-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border/70 bg-white/85 text-navy shadow-sm backdrop-blur-sm transition-colors hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:h-11 sm:w-11"
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="تصویر بعدی"
              className="absolute end-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border/70 bg-white/85 text-navy shadow-sm backdrop-blur-sm transition-colors hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:h-11 sm:w-11"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
          </>
        )}
      </div>

      {hasMultiple && (
        <div className="flex gap-2 overflow-x-auto">
          {images.map((image, i) => (
            <button
              key={image.url}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`نمایش تصویر ${i + 1} از ${count}`}
              aria-current={i === index}
              className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-medical-bg transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                i === index
                  ? "ring-2 ring-primary ring-offset-2"
                  : "opacity-60 hover:opacity-100"
              }`}
            >
              <Image
                src={mediaUrl(image.url)}
                alt={image.altText ?? productName}
                fill
                sizes="80px"
                className="object-contain p-1.5"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
