import type { ReactNode } from "react";

/**
 * Renders both language versions inline and lets CSS (keyed on `<html lang>`,
 * see globals.css) show the active one. No hooks, so it works identically in
 * server and client components, and switching languages never triggers a React
 * re-render — the same principle the theme uses.
 *
 * Use the block variant `<TBlock>` when the content is block-level (paragraphs,
 * lists, an MDX body) so the wrapper isn't an inline `<span>`.
 */
export function T({ en, id }: { en: ReactNode; id: ReactNode }) {
  return (
    <>
      <span data-lc="en">{en}</span>
      <span data-lc="id">{id}</span>
    </>
  );
}

export function TBlock({
  en,
  id,
  className,
}: {
  en: ReactNode;
  id: ReactNode;
  className?: string;
}) {
  return (
    <>
      <div data-lc="en" className={className}>
        {en}
      </div>
      <div data-lc="id" className={className}>
        {id}
      </div>
    </>
  );
}
