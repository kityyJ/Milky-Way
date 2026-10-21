const SOURCE = "https://www.jia.nz/__jia/cloud-posts.json";
const ENGLISH_COPY = {
  "game/td2": { title: "The Division 2 TUY8S3.2 Update Explained: Red Moon Unleashed, Mutiny Rewards, New Weapons & Central Park DLC", excerpt: "A guide to the Red Moon Unleashed event, boss drop rates, event keys, Mutiny rewards, the Lichtenberg named weapon, the Conflict rework, and official details on the Central Park DLC." },
  "tech/google": { title: "Build an Android App with Google AI Studio: From App Generation to Phone Testing", excerpt: "Create a Kotlin and Jetpack Compose Android app with Google AI Studio Build, preview it in the browser, then test it on a phone with ADB or Play internal testing." },
  "ai/agent": { title: "HydraFusion in Practice: Multi-Model Collaboration in VS Code and Copilot App", excerpt: "Set up GitHub Copilot HydraFusion, troubleshoot missing model options, and use a reviewable workflow for debugging, code explanations, and multi-step changes." },
  "github/actions": { title: "GitHub Actions Lockfiles: Pin Dependencies and Verify Them in CI", excerpt: "Learn to generate an actions lockfile, review its changes, and verify pinned dependencies in CI, with notes on previews, organization allowlists, and local actions." }
};
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
        const translated = ENGLISH_COPY[path];
        return {
          title: (translated?.title || String(post.title || "")).slice(0, 180),
          excerpt: (translated?.excerpt || String(post.excerpt || "")).slice(0, 360),
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
