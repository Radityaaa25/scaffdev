/**
 * Definisi filter SVG untuk animasi gooey (satu instance per halaman —
 * id harus unik, jangan diduplikat). Dipakai tombol .btn-gooey di
 * halaman /templates dan /integrasi.
 */
export function GooeyFilter() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      version="1.1"
      aria-hidden="true"
      style={{ display: "block", height: 0, width: 0, position: "absolute" }}
    >
      <defs>
        <filter id="btn-gooey-filter">
          <feGaussianBlur in="SourceGraphic" stdDeviation={10} result="blur" />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
            result="goo"
          />
          <feBlend in="SourceGraphic" in2="goo" />
        </filter>
      </defs>
    </svg>
  );
}
