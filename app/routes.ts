import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("about", "routes/about.tsx"),
  route("blog", "routes/blog.tsx"),
  route("blog/:slug", "routes/blog.$slug.tsx"),
  route("sitemap.xml", "routes/sitemap[.]xml.tsx"),
  route("api/likes/:slug", "routes/api.likes.$slug.tsx")
] satisfies RouteConfig;
