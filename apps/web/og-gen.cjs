/**
 * Generator OG image (1200x630) untuk scaffdev.
 * Sekali jalan:  node og-gen.cjs   → menulis public/og.png
 *
 * Kenapa script, bukan app/opengraph-image.tsx:
 * file-based metadata punya PRIORITAS LEBIH TINGGI dari metadata object,
 * jadi file di app/ akan meng-override og:image screenshot tiap template
 * di /templates/[slug]. PNG statis + metadata object = kendali penuh.
 *
 * Font pakai buffer Geist (bukan @font-face SVG): librsvg/sharp tidak
 * memuat @font-face data-URI, teksnya jatuh ke font sistem.
 */
const { ImageResponse } = require("next/og");
const React = require("react");
const fs = require("fs");
const path = require("path");

const GEIST = path.join(
  __dirname,
  "../../node_modules/.pnpm/geist@1.7.2_next@16.3.5_@ty_6b8b289196ac0d83a332f9652f1e9962/node_modules/geist/dist/fonts"
);
const font = (p) => fs.readFileSync(path.join(GEIST, p));

const el = (type, props, ...children) =>
  React.createElement(type, props, ...(children.flat(Infinity).filter(Boolean)));

const BOX = { display: "flex" };

async function main() {
  const fonts = [
    { name: "Geist", data: font("geist-sans/Geist-Bold.ttf"), weight: 700, style: "normal" },
    { name: "Geist", data: font("geist-sans/Geist-Medium.ttf"), weight: 500, style: "normal" },
    { name: "Geist", data: font("geist-sans/Geist-Regular.ttf"), weight: 400, style: "normal" },
    { name: "GeistMono", data: font("geist-mono/GeistMono-Medium.ttf"), weight: 500, style: "normal" },
  ];

  const logo = "data:image/png;base64," +
    fs.readFileSync(path.join(__dirname, "public/logo-icon.png")).toString("base64");

  const res = await new ImageResponse(
    el(
      "div",
      {
        style: {
          ...BOX,
          flexDirection: "column",
          width: "100%",
          height: "100%",
          backgroundColor: "#0A0A0B",
          padding: "64px 72px",
          position: "relative",
        },
      },
      // Glow ungu kiri-atas
      el("div", {
        style: {
          position: "absolute",
          top: -200,
          left: -160,
          width: 860,
          height: 620,
          borderRadius: 999,
          background:
            "radial-gradient(circle, rgba(139,92,246,0.32) 0%, rgba(91,33,182,0.12) 48%, rgba(10,10,11,0) 74%)",
        },
      }),
      // Grid halus
      el("div", {
        style: {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.55,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        },
      }),
      // Rule kiri
      el("div", {
        style: {
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 6,
          background: "linear-gradient(180deg, #8B5CF6 0%, rgba(139,92,246,0) 100%)",
        },
      }),

      // Brand
      el(
        "div",
        { style: { ...BOX, alignItems: "center", gap: 14 } },
        el("img", { src: logo, width: 46, height: 46 }),
        el(
          "div",
          { style: { ...BOX, fontSize: 28, fontWeight: 700, color: "#FAFAFA", letterSpacing: -0.5 } },
          "Scaffdev"
        )
      ),

      // Konten bawah
      el(
        "div",
        { style: { ...BOX, flexDirection: "column", marginTop: "auto" } },
        el(
          "div",
          { style: { ...BOX, fontSize: 92, fontWeight: 700, color: "#FAFAFA", letterSpacing: -4, lineHeight: 1 } },
          "Scaffdev"
        ),
        el(
          "div",
          { style: { ...BOX, fontSize: 33, fontWeight: 500, color: "#8B5CF6", marginTop: 16 } },
          "Starter Kit Next.js & Laravel Siap Jalan"
        ),
        el(
          "div",
          { style: { ...BOX, flexDirection: "column", fontSize: 25, fontWeight: 400, color: "#A1A1AA", marginTop: 24, gap: 6 } },
          el("div", null, "Tampilan visual jadi + kurasi integrasi Indonesia."),
          el("div", null, "Satu baris command — tanpa boilerplate dari nol.")
        ),

        // Command box
        el(
          "div",
          {
            style: {
              ...BOX,
              alignItems: "center",
              gap: 16,
              marginTop: 34,
              backgroundColor: "#131316",
              border: "2px solid rgba(139,92,246,0.45)",
              borderRadius: 14,
              padding: "18px 26px",
              alignSelf: "flex-start",
            },
          },
          el("div", { style: { width: 13, height: 13, borderRadius: 999, backgroundColor: "#8B5CF6" } }),
          el(
            "div",
            { style: { ...BOX, fontFamily: "GeistMono", fontSize: 29, fontWeight: 500, color: "#C4B5FD" } },
            "npx scaffdev@latest"
          )
        ),

        el(
          "div",
          { style: { ...BOX, fontSize: 21, fontWeight: 500, color: "#71717A", letterSpacing: 2, marginTop: 30 } },
          "SCAFFDEV.VERCEL.APP"
        )
      )
    ),
    { width: 1200, height: 630, fonts }
  );

  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(path.join(__dirname, "public/og.png"), buf);
  console.log("og.png OK:", buf.length, "bytes");
}

main().catch((e) => {
  console.error("ERR:", e.message);
  process.exit(1);
});
