// Minifica CSS y JS de src/ hacia public/ para servir en producción.
// Los ficheros de src/ NO se tocan: siguen siendo la fuente legible.
// bundle:false a propósito — main.js usa import() dinámico en runtime
// hacia /vendor/gsap/... (Fase 4.5, A02) y NO debe inlinearse ahí.
import * as esbuild from "esbuild";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const objetivos = [
  { from: "src/css/tokens.css", to: "public/css/tokens.min.css", loader: "css" },
  { from: "src/css/main.css", to: "public/css/main.min.css", loader: "css" },
  { from: "src/js/main.js", to: "public/js/main.min.js", loader: "js" },
];

for (const { from, to, loader } of objetivos) {
  const src = path.join(root, from);
  const dest = path.join(root, to);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const resultado = await esbuild.build({
    entryPoints: [src],
    bundle: false,
    minify: true,
    loader: { [path.extname(src)]: loader },
    write: false,
  });
  fs.writeFileSync(dest, resultado.outputFiles[0].contents);
  const antes = fs.statSync(src).size;
  const despues = fs.statSync(dest).size;
  console.log(`${from} -> ${to} (${antes}B -> ${despues}B)`);
}
