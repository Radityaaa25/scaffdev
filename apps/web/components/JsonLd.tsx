/**
 * Render JSON-LD terstruktur (server-side agar terbaca crawler & AI).
 * W1: escape "<" agar data (mis. nama template dari admin) tidak bisa
 * menutup tag <script> (breakout XSS via "</script><script>...").
 */
export function JsonLd({ data }: { data: unknown }) {
  const safe = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}
