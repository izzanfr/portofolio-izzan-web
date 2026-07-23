import type { MDXComponents } from "mdx/types";

/**
 * Shared MDX styling. Project case studies are plain markdown, so every element
 * they can produce is given a class here rather than relying on a prose plugin.
 */
export const mdxComponents: MDXComponents = {
  h2: (props) => (
    <h2
      className="mt-12 mb-4 text-xl tracking-[-0.024em] first:mt-0 md:text-2xl"
      {...props}
    />
  ),
  h3: (props) => (
    <h3 className="mt-8 mb-3 text-base tracking-[-0.018em] md:text-lg" {...props} />
  ),
  p: (props) => <p className="mb-5 leading-[1.8] text-muted" {...props} />,
  ul: (props) => <ul className="mb-6 space-y-2.5" {...props} />,
  ol: (props) => <ol className="mb-6 list-decimal space-y-2.5 pl-5 text-muted" {...props} />,
  li: (props) => (
    <li className="relative pl-5 leading-relaxed text-muted marker:text-accent" {...props}>
      <span
        aria-hidden
        className="absolute left-0 top-[0.65em] h-1 w-1 rounded-full bg-accent"
      />
      {props.children}
    </li>
  ),
  strong: (props) => <strong className="font-semibold text-foreground" {...props} />,
  em: (props) => <em className="italic" {...props} />,
  a: (props) => (
    <a
      className="underline decoration-accent underline-offset-4 transition-colors hover:text-accent-strong dark:hover:text-accent"
      {...props}
    />
  ),
  blockquote: (props) => (
    <blockquote
      className="my-6 border-l-2 border-accent bg-surface/60 py-3 pl-5 pr-4 text-muted italic"
      {...props}
    />
  ),
  code: (props) => (
    <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[0.85em]" {...props} />
  ),
  hr: () => <hr className="my-10 border-border" />,
};

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return { ...mdxComponents, ...components };
}
