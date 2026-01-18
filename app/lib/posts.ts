export interface Frontmatter {
  title: string;
  date: string;
  excerpt?: string;
  category: "essay" | "tech";
}

export interface MDXModule {
  frontmatter: Frontmatter;
  default: React.ComponentType<{ components?: Record<string, unknown> }>;
}

export interface Post {
  slug: string;
  title: string;
  date: string;
  excerpt?: string;
  category: "essay" | "tech";
}

// Load all MDX files from content directory
// Path is relative to this file (app/lib/posts.ts)
const mdxModules = import.meta.glob<MDXModule>("../content/*.mdx", {
  eager: true,
});

// Get all posts as array
export function getAllPosts(): Post[] {
  return Object.entries(mdxModules)
    .map(([path, module]) => {
      const slug = path.match(/\/([^/]+)\.mdx$/)?.[1] || "";
      return {
        slug,
        ...module.frontmatter,
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// Get single post by slug
export function getPost(slug: string): MDXModule | null {
  const path = `../content/${slug}.mdx`;
  return mdxModules[path] || null;
}
