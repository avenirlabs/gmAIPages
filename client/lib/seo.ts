export function setSeo(title?: string | null, description?: string | null) {
  const t = (title || "Giftsmate — Find Gifts with AI").trim();

  if (typeof document !== "undefined") {
    // Title
    document.title = t;

    // Description
    setOrCreate('meta[name="description"]', 'name', 'description', (description || "").slice(0, 300));

    // OG basics
    setOrCreate('meta[property="og:title"]', 'property', 'og:title', t);
    if (description) {
      setOrCreate('meta[property="og:description"]', 'property', 'og:description', description.slice(0, 300));
    }
    setOrCreate('meta[property="og:type"]', 'property', 'og:type', 'website');
  }
}

function setOrCreate(selector: string, attr: 'name'|'property', key: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}
