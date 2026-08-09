// Fase 4.5 — A03: genera dos variantes WebP (700w / 1400w) por obra a
// partir del póster JPG de 1280 (la fuente, en public/assets/, INTOCADA).
// Los anchos responden al techo de retina del contrato (tokens.css §4):
// 350px de visor móvil x2 = 700, 620px de visor desktop x2 = 1400.
// Las imágenes Open Graph NO pasan por aquí — siguen siendo JPG (fase 6).
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const OBRAS_JS = path.join(root, "src", "data", "obras.js");

const ANCHOS = [700, 1400];
const CALIDAD_WEBP = 82;

function leerObras() {
  // obras.js es un <script> de navegador ("const OBRAS = [...]"), no un
  // módulo — un `const` de nivel superior no cuelga del objeto sandbox,
  // así que se recupera con una segunda evaluación en el mismo contexto.
  const codigo = fs.readFileSync(OBRAS_JS, "utf8");
  const contexto = vm.createContext({});
  vm.runInContext(codigo, contexto);
  const OBRAS = vm.runInContext("OBRAS", contexto);
  if (!Array.isArray(OBRAS)) {
    throw new Error(`No se encontró OBRAS como array en ${OBRAS_JS}`);
  }
  return OBRAS;
}

async function generar() {
  const obras = leerObras();
  let generadas = 0;

  for (const obra of obras) {
    const origen = path.join(root, "public", obra.poster.replace(/^\//, ""));
    if (!fs.existsSync(origen)) {
      console.error(`falta el original: ${origen}`);
      process.exitCode = 1;
      continue;
    }

    for (const ancho of ANCHOS) {
      const campo = ancho === 700 ? "poster700" : "poster1400";
      const destinoRel = obra[campo];
      if (!destinoRel) {
        throw new Error(`obras.js: falta el campo ${campo} en "${obra.slug}"`);
      }
      const destino = path.join(root, "public", destinoRel.replace(/^\//, ""));
      fs.mkdirSync(path.dirname(destino), { recursive: true });
      await sharp(origen).resize({ width: ancho }).webp({ quality: CALIDAD_WEBP }).toFile(destino);
      console.log(path.relative(root, destino));
      generadas++;
    }
  }

  console.log(`generar-posters: ${generadas} variantes WebP generadas.`);
}

generar();
