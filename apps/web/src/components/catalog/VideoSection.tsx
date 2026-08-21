"use client";

import { useState } from "react";
import { ExternalLink, PlayCircle } from "lucide-react";
import { resolveVideoEmbed } from "@/lib/video-embed";

// Loads no player/iframe until the user actually clicks — the facade is
// just a static preview, so an unopened product page never pays the
// weight of an embedded video player.
export function VideoSection({
  url,
  source,
  title,
}: {
  url: string | null;
  source: string | null;
  title: string | null;
}) {
  const [loaded, setLoaded] = useState(false);

  if (!url) return null;

  const decision = resolveVideoEmbed(url, source);
  const caption = title ?? "ویدیوی آموزشی نحوه استفاده از این محصول";

  return (
    <div>
      <h2 className="mb-2 text-base font-bold text-navy">
        ویدیوی آموزشی محصول
      </h2>

      {decision.type === "iframe" && (
        <div className="flex flex-col gap-2">
          <div className="relative aspect-video overflow-hidden rounded-2xl bg-medical-bg">
            {loaded ? (
              <iframe
                src={decision.src}
                title={caption}
                className="absolute inset-0 h-full w-full"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <button
                type="button"
                onClick={() => setLoaded(true)}
                aria-label="پخش ویدیوی آموزشی"
                className="group absolute inset-0 flex flex-col items-center justify-center gap-3 text-primary transition-colors hover:text-primary-dark"
              >
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-md transition-transform group-hover:scale-105">
                  <PlayCircle className="h-9 w-9" aria-hidden="true" />
                </span>
                <span className="max-w-[80%] text-center text-sm font-medium text-navy">
                  {caption}
                </span>
              </button>
            )}
          </div>

          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-secondary-text transition-colors hover:text-primary"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            مشاهده در آپارات
          </a>
        </div>
      )}

      {decision.type === "video" && (
        <video
          controls
          preload="none"
          className="w-full rounded-2xl bg-medical-bg"
          src={decision.src}
        />
      )}

      {decision.type === "link" && (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-medical-bg p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-primary shadow-sm">
              <PlayCircle className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-bold text-navy">
                ویدیوی آموزشی نحوه استفاده
              </p>
              <p className="mt-0.5 text-xs text-secondary-text">{caption}</p>
            </div>
          </div>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 whitespace-nowrap rounded-xl bg-primary px-4 py-2.5 text-xs font-medium text-white transition-colors hover:bg-primary-dark"
          >
            مشاهده ویدیوی آموزشی طب و صنعت
          </a>
        </div>
      )}
    </div>
  );
}
