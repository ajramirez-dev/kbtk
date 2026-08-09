// Fase 6 (G05) — fusiona src/ + public/ en dist/, el único directorio
// que Netlify puede publicar. Hasta ahora solo dev-server.mjs fusionaba
// ambas raíces, y únicamente en local: no había ningún paso de build
// que produjera un árbol único para producción.
// Copia SOLO lo que se sirve por URL en tiempo de ejecución — no toda
// src/ (css/main.css, js/main.js y contenido/*.json son fuentes de
// build, no assets servidos; sus salidas ya viven en public/css,
// public/js vía npm run build:min).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const DIST = path.join(root, "dist");

function copiarArbol(origen, destino) {
  fs.mkdirSync(destino, { recursive: true });
  for (const entrada of fs.readdirSync(origen, { withFileTypes: true })) {
    const desde = path.join(origen, entrada.name);
    const hasta = path.join(destino, entrada.name);
    if (entrada.isDirectory()) copiarArbol(desde, hasta);
    else fs.copyFileSync(desde, hasta);
  }
}

function copiarSiExiste(desde, hasta) {
  if (!fs.existsSync(desde)) return;
  fs.mkdirSync(path.dirname(hasta), { recursive: true });
  fs.copyFileSync(desde, hasta);
}

function construir() {
  fs.rmSync(DIST, { recursive: true, force: true });

  // 1 · todo public/ (assets versionados, css/js minificados, og,
  //     iconos, manifest, _headers, robots.txt, sitemap.xml...)
  copiarArbol(path.join(root, "public"), DIST);

  // 2 · páginas HTML servidas desde src/ (no minificadas: main.min.css
  //     y main.min.js ya vienen minificados desde public/, el HTML no)
  copiarSiExiste(path.join(root, "src", "index.html"), path.join(DIST, "index.html"));
  copiarSiExiste(path.join(root, "src", "en", "index.html"), path.join(DIST, "en", "index.html"));

  const obrasDir = path.join(root, "src", "obras");
  if (fs.existsSync(obrasDir)) {
    for (const slug of fs.readdirSync(obrasDir)) {
      copiarSiExiste(
        path.join(obrasDir, slug, "index.html"),
        path.join(DIST, "obras", slug, "index.html")
      );
    }
  }

  // 3 · data/obras.js se sirve crudo (sin minificar), <script src="/data/obras.js">
  copiarSiExiste(path.join(root, "src", "data", "obras.js"), path.join(DIST, "data", "obras.js"));

  console.log(`build-dist: ${DIST} listo.`);
}

construir();
