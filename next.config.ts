import type { NextConfig } from "next";

// Project case studies are compiled at request time by next-mdx-remote, not as
// file-based .mdx pages, so no @next/mdx setup is needed here.
const nextConfig: NextConfig = {
  // A stray lockfile in the home directory otherwise wins root inference
  turbopack: { root: import.meta.dirname },
};

export default nextConfig;
