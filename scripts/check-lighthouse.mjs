// Bloque 5 — el objetivo de 90 en Performance móvil vivía en el flujo
// de trabajo, fuera del repo: por eso ninguna búsqueda en docs/ lo
// encontraba. Se promociona a herramienta.
//
// Ejecuta Lighthouse móvil 5 veces sobre / y 5 veces sobre una página
// de obra, toma la MEDIANA de Performance de cada una (una sola
// ejecución es ruido — ver la sesión de verificación del bloque A,
// donde una pasada suelta dio 88 y la mediana de cinco dio 90) y
// falla si alguna de las dos baja de 90. CLS/LCP/TBT se imprimen
// como referencia, sin bloquear: el LCP de ~3.4s medido contra
// dev-server es conocido y deliberadamente no se optimiza aquí —
// dev-server no tiene brotli ni HTTP/2, así que ese número no es
// representativo de producción. Se decide con datos de kbtk.digital
// después de desplegar, no aquí.
//
// Requiere el sitio servido (`npm run dev`, puerto 5500 por defecto —
// CHECK_BASE_URL lo cambia) y un Chromium disponible. Si chrome-launcher
// no encuentra uno instalado en el sistema, exporta CHECK_CHROME_PATH
// apuntando al binario (p. ej. el de Playwright, ya presente en este
// proyecto vía node_modules/playwright).
import * as chromeLauncher from "chrome-launcher";
import lighthouse from "lighthouse";

const BASE = process.env.CHECK_BASE_URL || "http://localhost:5500";
const EJECUCIONES = 5;
const UMBRAL_PERFORMANCE = 90;

const PAGINAS = [
  { nombre: "/ (home)", url: `${BASE}/` },
  { nombre: "/obras/soul-barber-studio/", url: `${BASE}/obras/soul-barber-studio/` },
];

const CONFIG = {
  extends: "lighthouse:default",
  settings: {
    onlyCategories: ["performance"],
    formFactor: "mobile",
    throttlingMethod: "simulate",
  },
};

function mediana(valores) {
  const s = [...valores].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

async function medirPagina(puerto, url) {
  const runs = [];
  for (let i = 0; i < EJECUCIONES; i++) {
    const resultado = await lighthouse(url, { port: puerto, output: "json" }, CONFIG);
    const a = resultado.lhr.audits;
    runs.push({
      perf: resultado.lhr.categories.performance.score * 100,
      cls: a["cumulative-layout-shift"].numericValue,
      lcp: a["largest-contentful-paint"].numericValue,
      tbt: a["total-blocking-time"].numericValue,
    });
  }
  return runs;
}

async function main() {
  const chrome = await chromeLauncher.launch({
    chromeFlags: ["--headless=new"],
    ...(process.env.CHECK_CHROME_PATH ? { chromePath: process.env.CHECK_CHROME_PATH } : {}),
  });

  let huboFallo = false;

  try {
    for (const pagina of PAGINAS) {
      console.log(`\n--- ${pagina.nombre} · ${EJECUCIONES} ejecuciones ---`);
      const runs = await medirPagina(chrome.port, pagina.url);

      runs.forEach((r, i) =>
        console.log(
          `  run ${i + 1}: Perf=${r.perf.toFixed(0)}  CLS=${r.cls.toFixed(4)}  LCP=${r.lcp.toFixed(0)}ms  TBT=${r.tbt.toFixed(1)}ms`
        )
      );

      const medPerf = mediana(runs.map((r) => r.perf));
      const medCls = mediana(runs.map((r) => r.cls));
      const medLcp = mediana(runs.map((r) => r.lcp));
      const medTbt = mediana(runs.map((r) => r.tbt));

      const estado = medPerf >= UMBRAL_PERFORMANCE ? "OK" : "FALLO";
      console.log(`  mediana Performance = ${medPerf.toFixed(0)} (umbral ${UMBRAL_PERFORMANCE}) — ${estado}`);
      console.log(`  mediana CLS = ${medCls.toFixed(4)}  (informativo, no bloquea)`);
      console.log(`  mediana LCP = ${medLcp.toFixed(0)}ms  (informativo, no bloquea)`);
      console.log(`  mediana TBT = ${medTbt.toFixed(1)}ms  (informativo, no bloquea)`);

      if (medPerf < UMBRAL_PERFORMANCE) huboFallo = true;
    }
  } finally {
    // chrome-launcher en Windows a veces falla al borrar su carpeta
    // temporal justo después de matar el proceso (el propio Chrome
    // aún tiene el directorio bloqueado un instante) — EPERM aquí es
    // limpieza fallida, no un check en rojo; no debe pisar huboFallo.
    try {
      await chrome.kill();
    } catch (err) {
      console.warn(`  (aviso: no se pudo limpiar el perfil temporal de Chrome — ${err.message})`);
    }
  }

  console.log("");
  if (huboFallo) {
    console.error(`check-lighthouse: mediana de Performance por debajo de ${UMBRAL_PERFORMANCE} en al menos una página.`);
    process.exit(1);
  }
  console.log("check-lighthouse: todo en verde.");
}

main().catch((err) => {
  console.error("check-lighthouse: error inesperado —", err.message);
  process.exit(1);
});
