// Regenera los PNG de Open Graph (1200×630) desde public/og/plantilla.html
// (home, /tarifa) y public/og/plantilla-obra.html (cada obra), vía
// Playwright. Los PNG anteriores (og-*-v1.png, og-home-v2.png) seguían
// diciendo KBTK.DEV aunque las plantillas ya dicen KBTK.DIGITAL — no era
// un problema de plantilla, era que nadie había vuelto a ejecutar el
// screenshot desde el cambio de dominio.
// Salida versionada -v3 para TODOS (obras incluidas, que iban por -v1):
// /og/og-*.png se sirve con Cache-Control immutable (vercel.json), así
// que reemplazar el mismo nombre sería mentirle a quien ya lo tiene en
// caché. Subir todos a -v3 a la vez, en vez de -v2 para unos y -v1
// para otros, deja la versión legible de un vistazo.
//
// Requiere Playwright con Chromium instalado (`npx playwright install
// chromium`) y el sitio servido en http://localhost:5500 (`npm run dev`).
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const OG_DIR = path.join(root, "public", "og");
const OBRAS_JS = path.join(root, "src", "data", "obras.js");
const BASE = process.env.OG_BASE_URL || "http://localhost:5500";
const VERSION = "v3";

function leerObras() {
  const codigo = fs.readFileSync(OBRAS_JS, "utf8");
  const contexto = vm.createContext({});
  vm.runInContext(codigo, contexto);
  return vm.runInContext("OBRAS", contexto);
}

function conSlots(html, slots) {
  let out = html;
  for (const [clave, valor] of Object.entries(slots)) {
    out = out.split(`{{${clave}}}`).join(valor);
  }
  return out;
}

async function generar() {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.OG_CHROME_PATH ? { executablePath: process.env.OG_CHROME_PATH } : {}),
  });
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });

  const plantillaHtml = fs.readFileSync(path.join(OG_DIR, "plantilla.html"), "utf8");
  const plantillaObraHtml = fs.readFileSync(path.join(OG_DIR, "plantilla-obra.html"), "utf8");

  const paginas = [
    {
      nombre: "home",
      html: conSlots(plantillaHtml, {
        TITULAR: "SU WEB YA EXISTE.",
        SUBTITULO: "La construimos entera antes de que usted decida si la paga.",
        FOOTER_DERECHA: "07 CONSTRUIDAS · 03 VENDIDAS · 04 EN ESTE PANEL",
      }),
    },
    {
      nombre: "tarifa",
      html: conSlots(plantillaHtml, {
        TITULAR: "TARIFA COMPLETA",
        SUBTITULO: "Los tres niveles están en la página principal. Aquí está todo lo demás, con su precio.",
        FOOTER_DERECHA: "03 NIVELES · IVA INCLUIDO · UN PAGO",
      }),
    },
  ];

  for (const obra of leerObras()) {
    paginas.push({
      nombre: obra.slug,
      html: conSlots(plantillaObraHtml, {
        ESTADO: obra.estado,
        NOMBRE_OBRA: obra.nombre,
        SECTOR: obra.sector,
        URL_O_SLUG: `KBTK.DIGITAL/OBRAS/${obra.slug.toUpperCase()}`,
      }),
      estiloInline: `--obra-accent: var(${obra.accentVar}); --obra-ink: var(${obra.inkVar});`,
    });
  }

  for (const { nombre, html, estiloInline } of paginas) {
    const tmp = path.join(OG_DIR, `.tmp-${nombre}.html`);
    fs.writeFileSync(tmp, html, "utf8");
    // servido por dev-server (BASE), no file://: la plantilla importa
    // /css/tokens.min.css con ruta absoluta de host.
    const url = `${BASE}/og/.tmp-${nombre}.html`;
    await page.goto(url, { waitUntil: "load" });
    if (estiloInline) {
      await page.evaluate((css) => document.documentElement.setAttribute("style", css), estiloInline);
    }
    await page.evaluate(() => document.fonts.ready);
    const destino = path.join(OG_DIR, `og-${nombre}-${VERSION}.png`);
    await page.screenshot({ path: destino });
    fs.unlinkSync(tmp);
    console.log(`generar-og: ${path.relative(root, destino)}`);
  }

  await browser.close();
}

generar();
