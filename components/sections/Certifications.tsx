import { CertificateCards } from "@/components/ui/CertificateCards";
import { getPublishers } from "@/lib/certifications";

/**
 * The one section that is not a section — it is a page.
 *
 * The first attempt at this framed the credentials as a card that scaled up as
 * you reached it. That was the wrong idea executed correctly: a box that grows
 * is still a box on a page, and the seams around it — the rounded corners, the
 * strip of off-white above and below — were exactly what gave it away. You
 * cannot suggest somewhere else while still showing the place you are in.
 *
 * So there is no box. The ground is edge to edge and floor to ceiling, taller
 * than the viewport, with nothing of the site's own surface visible around it:
 * scroll into it and the entire screen is this, scroll out and the site is
 * back. The dark arrives by wiping up over the page rather than by fading in,
 * which is the movement of one page being replaced by another rather than of
 * an element appearing on one.
 *
 * Inside it the scroll turns: the stage pins and the certificates travel
 * sideways, one pixel of rail for one pixel of wheel, and the pinning releases
 * the moment the last one lands. See CertificateCards for that mapping, and
 * for the two ways out of it — reduced motion and no script both get a plain
 * vertical column instead.
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
      // No background either. The dark belongs to the page that slides through
      // here, not to the slot it slides through — so when it leaves, it leaves
      // nothing behind for the next section to inherit.
      className="relative scroll-mt-24"
    >
      {/* The heading travels with the rail rather than sitting above it, so
          both live inside the pinned stage. Nothing is left out here to wrap
          them: the page is the rail. */}
      <CertificateCards publishers={getPublishers()} />

    </section>
  );
}
