"use client";

import Image from "next/image";
import { useCallback } from "react";
import { Modal } from "./Modal";
import { useCurrentLocale } from "@/components/providers/LocaleProvider";
import { pick, type BiText } from "@/lib/i18n";
import type { BiPhoto } from "@/lib/experience";

/**
 * Full-size photo viewer shared by every gallery on the site. The caller owns
 * which photo is open (`index`, or null for closed) and hands back the setter.
 * One photo at a time: each is opened from its own thumbnail, so there is no
 * stepping between photos inside the viewer.
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
          </div>

          {/*
            `w-0 min-w-full` keeps the caption out of the panel's width
            calculation — otherwise a long caption, not the photo, would
            decide how wide the frame is — while still filling whatever width
            the photo settles on. The clamps hold this row at a constant
            100px, which is the number the image's height budget is drawn
            against.
          */}
          <div className="w-0 min-w-full shrink-0 p-5">
            <p className="line-clamp-2 text-sm font-medium">
              {pick(active.caption ?? active.alt, locale)}
            </p>
            <p className="mt-1 truncate text-xs text-muted">
              {pick(context ? context(active) : label, locale)}
            </p>
          </div>
        </>
      )}
    </Modal>
  );
}
