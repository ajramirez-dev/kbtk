// Bloque A — verifica que el H1 de S1 (elemento LCP) no se desplaza
// entre el primer pintado y la llegada de Archivo. Dos comprobaciones:
//
//   1. Altura del H1 en el primer pintado (con el respaldo, "Archivo
//      Respaldo") vs. tras document.fonts.ready (con Archivo real).
//      Diferencia exigida: 0px exactos, a 390 y a 1440.
//      Para garantizar que el primer pintado ocurre de verdad con el
//      respaldo (y no con Archivo ya en caché), retrasa la respuesta
//      del woff2 vía page.route() — sin ese retraso el check podría
//      pasar en verde sin haber probado nada.
//   2. El sha256 del woff2 de Archivo coincide con el anotado en el
//      comentario de derivación de main.css. Los cuatro overrides
//      (size-adjust/ascent/descent/line-gap-override) están calculados
//      contra ESE binario — si alguien re-subsetea la fuente sin
//      recalcular, este check lo atrapa en vez de dejar pasar un
//      salto silencioso.
//
// Requiere Playwright con Chromium instalado y el sitio servido
// (`npm run dev`, puerto 5500 por defecto — CHECK_BASE_URL lo cambia).
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const FONT_PATH = path.join(root, "public", "fuentes", "Archivo[wdth,wght].woff2");
const MAIN_CSS_PATH = path.join(root, "src", "css", "main.css");
const BASE = process.env.CHECK_BASE_URL || "http://localhost:5500";
const ANCHOS = [390, 1440];

function hashDelArchivo() {
  return crypto.createHash("sha256").update(fs.readFileSync(FONT_PATH)).digest("hex");
}

function hashAnotadoEnCss() {
  const css = fs.readFileSync(MAIN_CSS_PATH, "utf8");
  const m = css.match(/sha256 del woff2[\s\S]*?([0-9a-f]{64})/);
  if (!m) {
    throw new Error(
      "No se encontró el hash anotado en el comentario de derivación de main.css " +
        '("sha256 del woff2..."). Sin ese ancla, este check no puede detectar un ' +
        "re-subset silencioso."
    );
  }
  return m[1];
}

async function medirAltura(browser, ancho) {
  const page = await browser.newPage({ viewport: { width: ancho, height: 900 } });

  // retraso artificial del woff2: fuerza a que el primer pintado ocurra
  // con el respaldo, nunca con Archivo ya resuelto desde caché o una
  // red local demasiado rápida para el propósito del check.
  await page.route("**/fuentes/Archivo*.woff2*", async (route) => {
    await new Promise((r) => setTimeout(r, 1200));
    await route.continue();
  });

  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });

  const primerPintado = await page.evaluate(async () => {
    await new Promise((r) => requestAnimationFrame(r));
    const h1 = document.querySelector('[data-seccion="s1"] h1');
    return {
      altura: h1.getBoundingClientRect().height,
      archivoListo: document.fonts.check('800 118px "Archivo"'),
    };
  });

  if (primerPintado.archivoListo) {
    await page.close();
    throw new Error(
      `A ${ancho}px, Archivo ya estaba listo en el primer frame — el retraso artificial ` +
        "de red no bastó para forzar el respaldo. El check no midió lo que dice medir; " +
        "sube el delay en medirAltura()."
    );
  }

  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(r)));

  const trasFuentes = await page.evaluate(() => {
    const h1 = document.querySelector('[data-seccion="s1"] h1');
    return h1.getBoundingClientRect().height;
  });

  await page.close();
  return { antes: primerPintado.altura, despues: trasFuentes };
}

async function main() {
  let huboFallo = false;

  console.log("--- 1 · hash del woff2 vs. el anotado en main.css ---");
  const hashReal = hashDelArchivo();
  const hashAnotado = hashAnotadoEnCss();
  if (hashReal !== hashAnotado) {
    console.error(`FALLO: el woff2 de Archivo no coincide con el binario contra el que se calcularon los overrides.`);
    console.error(`  anotado en main.css: ${hashAnotado}`);
    console.error(`  real ahora mismo:    ${hashReal}`);
    huboFallo = true;
  } else {
    console.log(`OK — ${hashReal}`);
  }

  console.log("\n--- 2 · altura del H1 de S1, primer pintado vs. tras fonts.ready ---");
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.CHECK_CHROME_PATH ? { executablePath: process.env.CHECK_CHROME_PATH } : {}),
  });

  for (const ancho of ANCHOS) {
    const { antes, despues } = await medirAltura(browser, ancho);
    const diff = Math.abs(despues - antes);
    const estado = diff === 0 ? "OK" : "FALLO";
    if (diff !== 0) huboFallo = true;
    console.log(
      `${ancho}px — primer pintado ${antes.toFixed(2)}px · tras fonts.ready ${despues.toFixed(2)}px ` +
        `· diferencia ${diff.toFixed(2)}px — ${estado}`
    );
  }

  await browser.close();

  console.log("");
  if (huboFallo) {
    console.error("check-fuentes: uno o más checks en rojo.");
    process.exit(1);
  }
  console.log("check-fuentes: todo en verde.");
}

main().catch((err) => {
  console.error("check-fuentes: error inesperado —", err.message);
  process.exit(1);
});
