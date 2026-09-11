import { CertificateCards } from "@/components/ui/CertificateCards";
import { getPublishers } from "@/lib/certifications";

/**
 * The one section that is not a section — it is a page.
 *
 * There is no box. A warm ivory sheet slides in from the right over the site's
 * own ground, the stage pins, and the certificates travel sideways, one pixel
 * of rail for one pixel of wheel; when the last one lands the sheet slides on
 * to the left, taking its ground with it. See CertificateCards for that
 * mapping, and for the two ways out of it — reduced motion and no script both
 * get a plain vertical column instead.
 */
export function Certifications() {
  return (
    <section
      id="credentials"
      // No padding, no radius, no max width. Every one of those would draw the
      // edge of a component, and the point is that there isn't one.
      // No `overflow-hidden`, and that is not an oversight: an ancestor with a
      // clipped overflow becomes the scroll container for anything
      // `position: sticky` inside it, and a container that does not itself
      // scroll cannot hold anything still. It silently cancelled the pinning,
      // which is why the rail used to travel sideways while the page carried
      // on downwards.
      //
      // No background either. The sheet's colour belongs to the page that
      // slides through here, not to the slot it slides through — so when it
      // leaves, it leaves nothing behind for the next section to inherit.
      className="relative scroll-mt-24"
    >
      {/* The heading travels with the rail rather than sitting above it, so
          both live inside the pinned stage. Nothing is left out here to wrap
          them: the page is the rail. */}
      <CertificateCards publishers={getPublishers()} />
    </section>
  );
}
