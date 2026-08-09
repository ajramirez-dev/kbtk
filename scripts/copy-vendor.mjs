// Copia GSAP y Lenis desde node_modules a public/vendor/.
// Cero CDN en este proyecto (misma política que las fuentes
// auto-alojadas): las librerías se sirven desde el propio dominio.
//
// Fase 4.5 (A02): main.js las carga con import() dinámico, solo en la
// rama de escritorio. import() exige módulos ES de verdad — el build
// "dist/*.min.js" de GSAP es UMD para <script> clásico: su propio
// wrapper hace `global.window = global.window || {}`, una asignación
// que en modo estricto (todo módulo ES lo es) revienta con
// "Cannot set property window of #<Window> which has only a getter".
// Por eso aquí se copian los fuentes ESM reales del paquete (los que
// consumiría un bundler vía `import gsap from "gsap"`), no el dist/.
// Ejecutar tras "npm install" si cambia la versión en package.json.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const copias = [
  // GSAP — fuentes ESM (node_modules/gsap/*.js), no dist/*.min.js.
  // Grafo de imports cerrado: index.js -> gsap-core.js, CSSPlugin.js;
  // ScrollTrigger.js -> Observer.js; CustomEase.js -> utils/paths.js.
  ["node_modules/gsap/index.js", "public/vendor/gsap/esm/index.js"],
  ["node_modules/gsap/gsap-core.js", "public/vendor/gsap/esm/gsap-core.js"],
  ["node_modules/gsap/CSSPlugin.js", "public/vendor/gsap/esm/CSSPlugin.js"],
  ["node_modules/gsap/ScrollTrigger.js", "public/vendor/gsap/esm/ScrollTrigger.js"],
  ["node_modules/gsap/Observer.js", "public/vendor/gsap/esm/Observer.js"],
  ["node_modules/gsap/CustomEase.js", "public/vendor/gsap/esm/CustomEase.js"],
  ["node_modules/gsap/utils/paths.js", "public/vendor/gsap/esm/utils/paths.js"],
  // Lenis — dist/lenis.mjs es un único fichero ESM sin imports externos.
  ["node_modules/lenis/dist/lenis.mjs", "public/vendor/lenis/lenis.mjs"],
];

for (const [from, to] of copias) {
  const src = path.join(root, from);
  const dest = path.join(root, to);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  console.log(`${from} -> ${to}`);
}
