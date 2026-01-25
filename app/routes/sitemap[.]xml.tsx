import { getAllPosts } from "@/lib/posts";

export function loader() {
  const posts = getAllPosts();
  const baseUrl = "https://mjoe.page";

  const routes = [
    { url: baseUrl, lastmod: new Date().toISOString(), priority: 1.0 },
    { url: `${baseUrl}/about`, lastmod: new Date().toISOString(), priority: 0.8 },
    { url: `${baseUrl}/blog`, lastmod: new Date().toISOString(), priority: 0.9 },
    ...posts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastmod: new Date(post.date).toISOString(),
      priority: 0.7,
    })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    (r) => `  <url>
    <loc>${r.url}</loc>
    <lastmod>${r.lastmod}</lastmod>
    <priority>${r.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
