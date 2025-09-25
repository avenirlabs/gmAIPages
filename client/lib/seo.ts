export function setSeo(title?: string | null, description?: string | null) {
  const t = (title || "Find your gifts with AI").trim();
  if (typeof document !== "undefined") {
    if (t) document.title = t;
    const name = "description";
    let meta = document.querySelector(
      `meta[name="${name}"]`,
    ) as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", name);
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", (description || "").slice(0, 300));
  }
}
