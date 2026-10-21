const SOURCE = "https://www.jia.nz/__jia/cloud-posts.json";
const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "public, max-age=60, s-maxage=120, stale-while-revalidate=300",
};

export async function onRequestGet() {
  try {
    const response = await fetch(SOURCE, {
      headers: { accept: "application/json" },
      cf: { cacheTtl: 120, cacheEverything: true },
    });
    if (!response.ok) {
      return Response.json({ posts: [] }, { status: 502, headers: JSON_HEADERS });
    }
    const payload = await response.json();
    const posts = (Array.isArray(payload.posts) ? payload.posts : [])
      .filter((post) => post.status === "published" && post.is_top === true)
      .sort((a, b) => (Number(b.featured_priority) || 0) - (Number(a.featured_priority) || 0)
        || new Date(b.published_at || 0).getTime() - new Date(a.published_at || 0).getTime())
      .slice(0, 20)
      .map((post) => {
        const path = String(post.public_path || "").replace(/^\/+|\/+$/g, "");
        const cover = String(post.cover || "");
        return {
          title: String(post.title || "").slice(0, 180),
          excerpt: String(post.excerpt || "").slice(0, 360),
          url: path && !path.split("/").some((part) => !/^[\p{L}\p{N}_-]+$/u.test(part))
            ? `https://www.jia.nz/${path}/`
            : "",
          cover: /^https:\/\//i.test(cover) ? cover : "",
          publishedAt: String(post.published_at || ""),
          priority: Number(post.featured_priority) || 0,
        };
      })
      .filter((post) => post.title && post.url);
    return Response.json({ posts }, { headers: JSON_HEADERS });
  } catch {
    return Response.json({ posts: [] }, { status: 502, headers: JSON_HEADERS });
  }
}
