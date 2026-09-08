/**
 * One curve, one set of distances, one set of durations — for every reveal on
 * the site.
 *
 * These numbers were already the house style; what they were not was in one
 * place. `[0.22, 1, 0.36, 1]` sat re-declared in eight components and inlined
 * in six more, which is how a curve drifts: the next edit only ever touches one
 * copy. Everything that animates now imports from here, so "the site's easing"
 * is a fact with an address rather than a convention.
 */

/** Signature curve: a fast départ that settles long — motion that arrives
 *  rather than slides. Used by every transition on the site. */
export const EASE = [0.22, 1, 0.36, 1] as const;

/** The same curve for CSS transitions (hover states, which Framer does not
 *  drive). Kept beside the array so the two can never disagree. */
export const EASE_CSS = "cubic-bezier(0.22, 1, 0.36, 1)";

/** Seconds. Long enough to read as deliberate, short enough that a visitor
 *  scrolling at speed is never waiting on it. */
export const REVEAL_DURATION = 0.5;

/** Pixels of travel on a reveal. Far enough to give the motion a direction,
 *  near enough that the element never reads as flying in from off-screen. */
export const REVEAL_DISTANCE = 20;

/** Seconds between staggered siblings. */
export const STAGGER_STEP = 0.08;

/** Milliseconds a monospace label spends resolving out of noise. */
export const SCRAMBLE_DURATION = 500;

/**
 * Shared viewport rule. `once` is the whole point: a reveal that replays every
 * time the section scrolls back into view stops being an entrance and becomes
 * a tic. `amount` is deliberately low — a tall block should start its entrance
 * as its top edge clears, not once a quarter of it is already past.
 */
export const VIEWPORT = { once: true, amount: 0.2 } as const;

/**
 * Marks the document as scripted, and it runs in `<head>` so the class is set
 * before the first paint.
 *
 * Framer Motion writes an `initial` state into the server-rendered HTML —
 * `opacity: 0` on everything that reveals. That is correct while the runtime is
 * there to animate it away, and a blank page when it is not: a failed chunk, a
 * blocked CDN, JavaScript off. The stylesheet keys the hidden state to `.js`
 * so the default — no class, no script — is the whole page visible, and the
 * animation is only ever an enhancement layered on top.
 *
 * The timeout closes the gap the class alone leaves open. Setting it proves
 * only that an inline script ran, which is not the same as the motion bundle
 * having arrived — a failed or endlessly-stalled chunk would leave the class
 * set and the page blank. So the mark is provisional: Reveal stamps
 * `data-motion-ready` when its chunk evaluates, and anything still unstamped
 * after three seconds gets the class taken back and the content shown. The
 * cost when that fires late on a slow connection is a page that reveals
 * without animating, which is the right way to be wrong.
 */
export const motionInitScript = `(function(){var d=document.documentElement;d.classList.add("js");setTimeout(function(){if(!("motionReady" in d.dataset)){d.classList.remove("js");}},3000);})();`;
