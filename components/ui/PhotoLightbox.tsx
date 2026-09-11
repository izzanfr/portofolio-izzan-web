"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback } from "react";
import { Modal } from "./Modal";
import { useCurrentLocale } from "@/components/providers/LocaleProvider";
import { pick, type BiText } from "@/lib/i18n";
import type { BiPhoto } from "@/lib/experience";

/**
 * Full-size photo viewer shared by every gallery on the site. The caller owns
 * which photo is open (`index`, or null for closed) and hands back the setter;
 * stepping wraps around the list at both ends.
 */
export function PhotoLightbox<P extends BiPhoto>({
  photos,
  index,
  onChange,
  label,
  context,
}: {
  photos: P[];
  index: number | null;
  onChange: (index: number | null) => void;
  /** Accessible name of the dialog, e.g. the role or section it belongs to. */
  label: BiText;
  /** The smaller line under the caption. Defaults to the dialog label. */
  context?: (photo: P) => BiText;
}) {
  const locale = useCurrentLocale();
  const close = useCallback(() => onChange(null), [onChange]);
  const step = (delta: number) =>
    onChange(index === null ? null : (index + delta + photos.length) % photos.length);

  const active = index === null ? null : photos[index];

  return (
    <Modal
      open={active != null}
      onClose={close}
      label={`${pick(label, locale)} ${pick({ en: "photo viewer", id: "penampil foto" }, locale)}`}
      fit
      className="max-w-5xl"
    >
      {active && (
        <>
          {/*
            The height budget, not a percentage: `max-h-full` here resolves
            against a flex item whose own height is auto, so the browser
            treats it as indefinite and ignores it — the image kept its full
            height and pushed a scrollbar into the panel. Subtracting the
            chrome from the viewport is what actually binds. The figure is
            the overlay's padding (2rem, 4rem from md) plus the caption,
            which is pinned to 100px by the clamps below, plus a little
            slack. `svh` rather than `vh` so a phone's retracting URL bar
            cannot make the panel taller than the screen it is on.

            `w-auto` alongside it is what keeps the frame tight: when width
            is auto and max-height is what binds, CSS scales the width to
            match, so the panel — sized by this image — never grows bars
            beside it.
          */}
          <div className="relative flex items-center justify-center bg-navy">
            {/* Intrinsic sizing keeps portrait and landscape shots both fully visible */}
            <Image
              src={active.src}
              alt={pick(active.alt, locale)}
              width={1600}
              height={1200}
              sizes="90vw"
              className="block max-h-[calc(100svh_-_9rem)] w-auto max-w-full object-contain md:max-h-[calc(100svh_-_11rem)]"
            />

            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => step(-1)}
                  aria-label={pick({ en: "Previous photo", id: "Foto sebelumnya" }, locale)}
                  className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-navy/70 text-white backdrop-blur transition-colors hover:border-accent hover:text-accent"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => step(1)}
                  aria-label={pick({ en: "Next photo", id: "Foto berikutnya" }, locale)}
                  className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-navy/70 text-white backdrop-blur transition-colors hover:border-accent hover:text-accent"
                >
                  <ChevronRight size={18} />
                </button>
              </>
            )}
          </div>

          {/*
            `w-0 min-w-full` keeps the caption out of the panel's width
            calculation — otherwise a long caption, not the photo, would
            decide how wide the frame is — while still filling whatever width
            the photo settles on. The clamps hold this row at a constant
            100px, which is the number the image's height budget is drawn
            against; no wrapping, so the counter cannot drop to its own line
            and quietly spend height the budget has not allowed for.
          */}
          <div className="flex w-0 min-w-full shrink-0 items-baseline justify-between gap-3 p-5">
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm font-medium">
                {pick(active.caption ?? active.alt, locale)}
              </p>
              <p className="mt-1 truncate text-xs text-muted">
                {pick(context ? context(active) : label, locale)}
              </p>
            </div>
            <p className="shrink-0 font-mono text-xs text-muted">
              {(index ?? 0) + 1} / {photos.length}
            </p>
          </div>
        </>
      )}
    </Modal>
  );
}
