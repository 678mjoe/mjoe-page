# mjoe-page
毛乔的个人主页

```bash
bun dev
```

Technical Stack:
- React Router
- motion/react
- shadcn/ui
- bun
- mdxjs

AI Agent was used during the development.

## Blog post status

In an MDX post's frontmatter, set `completed: false` to mark the post as unfinished. Set `completed: true` or omit the field for a completed post.

```yaml
---
title: "文章标题"
date: "2026-01-25"
category: "essay"
completed: false
---
```

## Blog view counts

A view is recorded after an article has been visible for five consecutive seconds. The same browser and article count at most once every 30 minutes, measured from the last counted view. Common bots and suspicious user agents are filtered; Cloudflare bot metadata is used when available. These counts are estimates: automated browsers may still be counted, and readers who disable JavaScript or leave early may not be counted.

Before deploying the updated worker, apply the migrations to the existing D1 database in order (after authenticating Wrangler). If `0004` was already applied, start with `0005`. Run `0005` only once: it adds a column to an existing table.

```bash
bunx wrangler d1 execute DB --remote --file=migrations/0004_create_post_views.sql
bunx wrangler d1 execute DB --remote --file=migrations/0005_record_post_view_ips.sql
```

View totals are stored in `post_view_counts` and can be queried in the Cloudflare D1 console:

```sql
SELECT post_slug, view_count
FROM post_view_counts
ORDER BY view_count DESC;
```

Each counted view is also stored in `post_view_events` with its article, Cloudflare-provided IP address, and timestamp. The IP is `NULL` when unavailable. Repeated requests that are deduplicated do not create events, and IPs from past views cannot be recovered. Event records are retained until manually deleted.

```sql
SELECT post_slug, ip_address,
       datetime(viewed_at / 1000, 'unixepoch') AS viewed_at_utc
FROM post_view_events
ORDER BY viewed_at DESC;
```

Deduplication uses a separate short-lived browser identifier. The temporary rate-limit table stores IP-derived hashes rather than raw IP addresses; these hashes are pseudonymous, not anonymous. Expired deduplication and rate-limit entries are cleaned up opportunistically as new views arrive, while totals and view events remain.

## Copyright Statement

Since this repo is a mixture of codes and blog posts, I now make the statement below.

Except where otherwise is stated, this code is licensed under MIT License (See LICENSE File).

The shadcn/ui components under ```components/ui``` follows the MIT License from shadcn team (See LICENSE_shadcn File in that directory).

All the blog posts, including but not limited to all ```*.mdx``` under ```content``` folder follows the CC BY-NC License. See https://creativecommons.org/licenses/by-nc/4.0/.