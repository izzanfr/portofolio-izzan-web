import type { NextConfig } from "next";

// Project case studies are compiled at request time by next-mdx-remote, not as
// file-based .mdx pages, so no @next/mdx setup is needed here.
const nextConfig: NextConfig = {
  // A stray lockfile in the home directory otherwise wins root inference
  turbopack: { root: import.meta.dirname },
  experimental: {
    // Enables React's <ViewTransition> and makes Next fire a view transition on
    // route navigation. Drives the page transitions in app/template.tsx.
    viewTransition: true,
  },
};

export default nextConfig;
