// Verificación de la apertura de la home (fase 7).
//
// Todo se mide con la línea de tiempo CONGELADA: la apertura se anima
// con WAAPI y todas sus animaciones duran 1700 ms, así que
// ?apertura=freeze las pausa en t=0 y window.__aperturaSeek(ms) lleva a
// un instante exacto. Sin eso, "captura a 900 ms" sería una carrera
// contra el reloj y ninguna aceptación sería reproducible.
//
// Requiere el sitio servido (`npm run dev`, puerto 5500 por defecto —
// CHECK_BASE_URL lo cambia) y Playwright con Chromium.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const SALIDA = path.join(root, "capturas-animacion");
const BASE = process.env.CHECK_BASE_URL || "http://localhost:5500";

const VIEWPORTS = [
  { nombre: "390", width: 390, height: 844 },
  { nombre: "1440", width: 1440, height: 900 },
];
const INSTANTES = [0, 300, 600, 900, 1100, 1400, 1700];
const RELEVO = 1640;
const TOTAL = 1700;

// Referencia numérica del boceto de Claude Design, para contrastar. NO
// es la fuente: manda el DOM.
const BOCETO = {
  390: { cx: 27.6, cy: 24, s: 0.0839 },
  1440: { cx: 82.2, cy: 21.7, s: 0.1077 },
};

let fallos = 0;
const linea = [];
function anota(ok, texto) {
  if (!ok) fallos++;
  linea.push(`${ok ? "SÍ " : "NO "} · ${texto}`);
  console.log(`  ${ok ? "SÍ " : "NO "} ${texto}`);
}

async function abrirCongelada(browser, vp, extra = {}) {
  const page = await browser.newPage({
    viewport: { width: vp.width, height: vp.height },
    ...extra,
  });
  const consola = [];
  page.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning") consola.push(`${m.type()}: ${m.text()}`);
  });
  page.on("pageerror", (e) => consola.push(`pageerror: ${e.message}`));
  await page.goto(`${BASE}/?apertura=freeze`, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  return { page, consola };
}

const buscar = (page, ms) =>
  page.evaluate((t) => {
    window.__aperturaSeek(t);
    return new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  }, ms);

/* ---------- 1 · capturas de los siete instantes ---------- */
async function capturas(browser) {
  console.log("\n--- 1 · capturas a 0/300/600/900/1100/1400/1700 ms ---");
  for (const vp of VIEWPORTS) {
    const { page } = await abrirCongelada(browser, vp);
    for (const ms of INSTANTES) {
      await buscar(page, ms);
      await page.screenshot({ path: path.join(SALIDA, `apertura-${vp.nombre}-${String(ms).padStart(4, "0")}.png`) });
    }
    console.log(`  ${vp.nombre}: ${INSTANTES.length} capturas`);
    await page.close();
  }
  anota(true, `capturas escritas en capturas-animacion/ (${INSTANTES.length} x ${VIEWPORTS.length})`);
}

/* ---------- 2 · cinco recargas seguidas ---------- */
async function recargas(browser) {
  console.log("\n--- 2 · cinco recargas seguidas por viewport ---");
  for (const vp of VIEWPORTS) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    let corrio = 0;
    for (let i = 0; i < 5; i++) {
      await page.goto(`${BASE}/?apertura=freeze`, { waitUntil: "load" });
      const ok = await page.evaluate(() => {
        const el = document.getElementById("apertura");
        return !!el && typeof window.__aperturaSeek === "function" && el.getAnimations().length > 0;
      });
      if (ok) corrio++;
    }
    anota(corrio === 5, `${vp.nombre}: la apertura ocurre ${corrio}/5 recargas`);
    await page.close();
  }
}

/* ---------- 3 · prefers-reduced-motion ---------- */
async function reducido(browser) {
  console.log("\n--- 3 · prefers-reduced-motion ---");
  for (const vp of VIEWPORTS) {
    const page = await browser.newPage({
      viewport: { width: vp.width, height: vp.height },
      reducedMotion: "reduce",
    });
    await page.goto(`${BASE}/`, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    const estado = await page.evaluate(() => ({
      overlay: !!document.getElementById("apertura"),
      logo: getComputedStyle(document.querySelector(".status-bar__brand")).opacity,
    }));
    await page.screenshot({ path: path.join(SALIDA, `apertura-${vp.nombre}-reduced-motion.png`) });
    anota(
      !estado.overlay && estado.logo === "1",
      `${vp.nombre}: overlay ausente (${!estado.overlay}) y logotipo visible (opacity ${estado.logo})`
    );
    await page.close();
  }
}

/* ---------- 4 · aceptación del relevo ---------- */
async function relevo(browser) {
  console.log("\n--- 4 · aceptación del relevo (diff media por canal < 8) ---");
  for (const vp of VIEWPORTS) {
    const { page } = await abrirCongelada(browser, vp);
    const rect = await page.evaluate(() => {
      const r = document.querySelector(".status-bar__brand svg").getBoundingClientRect();
      return { x: Math.floor(r.x), y: Math.floor(r.y), width: Math.ceil(r.width), height: Math.ceil(r.height) };
    });

    const recortes = [];
    for (const ms of [RELEVO - 1, RELEVO + 1]) {
      await buscar(page, ms);
      const diag = await page.evaluate(() => {
        const l = document.querySelector(".apertura__lockup");
        const s = l.querySelector("svg").getBoundingClientRect();
        return `${getComputedStyle(l).transform} · dibujo ${s.width.toFixed(2)}x${s.height.toFixed(2)} @ ${s.x.toFixed(2)},${s.y.toFixed(2)}`;
      });
      console.log(`     t=${ms}: ${diag}`);
      const p = path.join(SALIDA, `relevo-${vp.nombre}-${ms}.png`);
      await page.screenshot({ path: p, clip: rect });
      recortes.push(p);
    }

    const [a, b] = await Promise.all(
      recortes.map((p) => sharp(p).removeAlpha().raw().toColourspace("srgb").toBuffer({ resolveWithObject: true }))
    );
    let suma = 0;
    const n = Math.min(a.data.length, b.data.length);
    for (let i = 0; i < n; i++) suma += Math.abs(a.data[i] - b.data[i]);
    const media = suma / n;
    anota(media < 8, `${vp.nombre}: diferencia media absoluta por canal = ${media.toFixed(3)} (umbral 8)`);
    await page.close();
  }
}

/* ---------- 5 · DIGITAL en --w1 antes del relevo ---------- */
async function digital(browser) {
  console.log("\n--- 5 · DIGITAL es --w1 exacto en el fotograma anterior al relevo ---");
  for (const vp of VIEWPORTS) {
    const { page } = await abrirCongelada(browser, vp);
    await buscar(page, RELEVO - 1);
    const r = await page.evaluate(() => {
      const el = document.querySelector(".apertura__digital");
      const w1 = getComputedStyle(document.documentElement).getPropertyValue("--w1").trim();
      const sonda = document.createElement("span");
      sonda.style.color = w1;
      document.body.appendChild(sonda);
      const esperado = getComputedStyle(sonda).color;
      sonda.remove();
      return { fill: getComputedStyle(el).fill, esperado, opacity: getComputedStyle(el).opacity };
    });
    anota(r.fill === r.esperado && r.opacity === "1", `${vp.nombre}: fill = ${r.fill} · esperado --w1 = ${r.esperado}`);
    await page.close();
  }
}

/* ---------- 6 · Fragment Mono lista en la primera conmutación ---------- */
async function fuente(browser) {
  console.log("\n--- 6 · Fragment Mono lista en la primera conmutación del barrido ---");
  for (const vp of VIEWPORTS) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    // Carga NORMAL, sin congelar y sin esperar a document.fonts.ready:
    // la aceptación va de qué fuente hay en pantalla en ese instante
    // real. Y el instante se cuenta desde el arranque de la ANIMACIÓN
    // (startTime, que main.js fija cuando corre en defer), no desde el
    // arranque del documento: son cosas distintas y confundirlas medía
    // una conmutación que nunca ocurre ahí.
    await page.addInitScript(() => {
      window.__fm = [];
      window.__t0 = null;
      const tick = () => {
        if (window.__t0 === null) {
          const el = document.getElementById("apertura");
          const as = el ? el.getAnimations({ subtree: true }) : [];
          if (as.length && as[0].startTime !== null) window.__t0 = as[0].startTime;
        }
        window.__fm.push({ t: performance.now(), ok: document.fonts.check('10px "Fragment Mono"') });
        if (performance.now() < 2500) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    await page.goto(`${BASE}/`, { waitUntil: "load" });
    await page.waitForFunction(() => window.__fm && window.__fm.length && window.__fm[window.__fm.length - 1].t >= 2500);
    const r = await page.evaluate(() => {
      // OBRAS se declara con const en data/obras.js, así que es un
      // binding léxico global y NO una propiedad de window.
      const n = typeof OBRAS !== "undefined" ? OBRAS.length : 0;
      const conmutacion = window.__t0 + 500 / n;
      const m = window.__fm;
      const cerca = m.reduce((a, b) => (Math.abs(b.t - conmutacion) < Math.abs(a.t - conmutacion) ? b : a));
      const primeraOk = m.find((x) => x.ok);
      return {
        n, t0: window.__t0, conmutacion, muestra: cerca,
        listaDesde: primeraOk ? primeraOk.t : null,
      };
    });
    anota(
      r.muestra.ok,
      `${vp.nombre}: fonts.check('10px "Fragment Mono"') = ${r.muestra.ok} en la primera conmutación ` +
        `(la apertura arranca a ${r.t0.toFixed(0)}ms, conmuta a ${r.conmutacion.toFixed(0)}ms; muestra a ` +
        `${r.muestra.t.toFixed(0)}ms; fuente lista desde ${r.listaDesde === null ? "nunca" : r.listaDesde.toFixed(0) + "ms"})`
    );
    await page.close();
  }
}

/* ---------- 7 · puerta de 390: ¿caben los nombres? ---------- */
async function puertaNombres(browser) {
  console.log("\n--- 7 · puerta de anchura de los nombres ---");
  for (const vp of VIEWPORTS) {
    const { page } = await abrirCongelada(browser, vp);
    await buscar(page, 400);
    const r = await page.evaluate(() => {
      const raiz = document.getElementById("apertura");
      const vw = raiz.getBoundingClientRect().width;
      const edge = parseFloat(getComputedStyle(document.querySelector(".grid-12")).paddingLeft);
      const limite = vw - edge;
      return [...document.querySelectorAll(".apertura__nombres span")].map((s) => {
        const b = s.getBoundingClientRect();
        return { nombre: s.textContent, derecha: b.right, sobra: limite - b.right };
      });
    });
    const peor = r.reduce((p, x) => (x.sobra < p.sobra ? x : p));
    anota(peor.sobra >= 0, `${vp.nombre}: el más ancho es ${peor.nombre} — ${peor.sobra >= 0 ? "cabe por" : "DESBORDA"} ${Math.abs(peor.sobra).toFixed(1)}px`);
    await page.close();
  }
}

/* ---------- 8 · consola limpia ---------- */
async function consola(browser) {
  console.log("\n--- 8 · consola ---");
  for (const vp of VIEWPORTS) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    const msgs = [];
    page.on("console", (m) => {
      if (m.type() === "error" || m.type() === "warning") msgs.push(`${m.type()}: ${m.text()}`);
    });
    page.on("pageerror", (e) => msgs.push(`pageerror: ${e.message}`));
    await page.goto(`${BASE}/`, { waitUntil: "load" });
    await page.waitForTimeout(2500); // más allá del final de la apertura
    anota(msgs.length === 0, `${vp.nombre}: ${msgs.length} mensajes${msgs.length ? " — " + msgs.join(" | ") : ""}`);
    await page.close();
  }
}

/* ---------- 9 · geometría del destino: DOM vs boceto ---------- */
async function geometria(browser) {
  console.log("\n--- 9 · geometría de la barra: medida en el DOM vs boceto ---");
  for (const vp of VIEWPORTS) {
    const { page } = await abrirCongelada(browser, vp);
    const r = await page.evaluate(() => {
      // caja de CONTENIDO del svg (preserveAspectRatio meet), no la del
      // elemento: a 390 el reset lo comprime y no coinciden.
      const b = document.querySelector(".status-bar__brand svg").getBoundingClientRect();
      const s = Math.min(b.width / 1255.787, b.height / 298);
      const ox = b.left + (b.width - 1255.787 * s) / 2;
      const oy = b.top + (b.height - 298 * s) / 2;
      const raiz = document.getElementById("apertura").getBoundingClientRect();
      const anchoLockup = Math.min(628, raiz.width * 0.644);
      const sHero = anchoLockup / 1255.787;
      return {
        s, cx: ox + 100 * s, cy: oy + 106 * s,
        cajaElemento: `${b.width.toFixed(2)}x${b.height.toFixed(2)}`,
        sHero, cxHero: (raiz.width - anchoLockup) / 2 + 100 * sHero, cyHero: raiz.height / 2,
      };
    });
    const ref = BOCETO[vp.nombre];
    console.log(
      `  ${vp.nombre} destino  DOM: cx ${r.cx.toFixed(1)} · cy ${r.cy.toFixed(1)} · s ${r.s.toFixed(4)} (caja del elemento ${r.cajaElemento})` +
      `   boceto: cx ${ref.cx} · cy ${ref.cy} · s ${ref.s}` +
      `   Δ: ${(r.cx - ref.cx).toFixed(1)} / ${(r.cy - ref.cy).toFixed(1)} / ${(r.s - ref.s).toFixed(4)}`
    );
    console.log(`  ${vp.nombre} hero     DOM: cx ${r.cxHero.toFixed(1)} · cy ${r.cyHero.toFixed(1)} · s ${r.sHero.toFixed(4)}`);
    await page.close();
  }
  anota(true, "geometría del destino medida en el DOM (manda el DOM, no el boceto)");
}

/* ---------- 10 · fase uno inmune al número de obras ---------- */
async function escalabilidad(browser) {
  console.log("\n--- 10 · la fase uno dura 500 ms sea cual sea el número de obras ---");
  for (const vp of VIEWPORTS) {
    const { page } = await abrirCongelada(browser, vp);
    const r = await page.evaluate(() => {
      const n = OBRAS.length; // const global: no cuelga de window
      const linea = document.querySelector(".apertura__linea");
      const spans = [...document.querySelectorAll(".apertura__nombres span")];
      const colores = linea.getAnimations().find((a) => a.effect.getKeyframes().some((k) => k.backgroundColor));
      const kfs = colores.effect.getKeyframes();
      const t = colores.effect.getTiming();
      // los cortes se sitúan en la línea de tiempo de la apertura:
      // retardo del efecto + offset x su duración. El barrido está
      // acotado a su propia ventana, así que no vale asumir 1700.
      const enApertura = (offset) => (t.delay || 0) + offset * t.duration;
      const ultimoCorte = enApertura(kfs[n - 1].computedOffset);
      return {
        n, spans: spans.length, ultimoCorte,
        msPorObra: 500 / n,
        ventana: `${t.delay || 0}–${(t.delay || 0) + t.duration}ms`,
        geometria: { left: linea.style.left, width: linea.style.width, top: linea.style.top },
      };
    });
    console.log(
      `  ${vp.nombre}: ${r.n} obras · ${r.spans} rótulos · ms_por_obra ${r.msPorObra} · ventana del barrido ${r.ventana} · último corte ${r.ultimoCorte.toFixed(0)}ms · línea ${r.geometria.left}/${r.geometria.width}`
    );
    anota(
      r.spans === r.n && Math.abs(r.ultimoCorte - (500 - r.msPorObra)) < 0.5,
      `${vp.nombre}: un rótulo por registro y el barrido cierra a los 500 ms`
    );
    await page.close();
  }
}

/* ---------- 11 · la apertura no deja rastro en la página real ----------
   .status-bar__brand es el ÚNICO elemento de la página que la apertura
   toca: no vive en el overlay —vive en el header— y durante 1700 ms
   lleva encima una animación de opacidad puesta por main.js. Cuando la
   apertura acaba, ese elemento tiene que quedar exactamente como si no
   hubiera pasado nada: sin animaciones, sin estilo en línea, sin capa
   promocionada. Y con prefers-reduced-motion, sin haber tenido nunca
   ninguna. */
async function sinRastro(browser) {
  console.log("\n--- 11 · sin rastro en la página real (.status-bar__brand) ---");
  for (const vp of VIEWPORTS) {
    for (const modo of ["normal", "reduce"]) {
      const page = await browser.newPage({
        viewport: { width: vp.width, height: vp.height },
        ...(modo === "reduce" ? { reducedMotion: "reduce" } : {}),
      });
      await page.goto(`${BASE}/`, { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(2500); // más allá del final de la apertura
      const r = await page.evaluate(() => {
        const el = document.querySelector(".status-bar__brand");
        const cs = getComputedStyle(el);
        return {
          overlay: !!document.getElementById("apertura"),
          animaciones: el.getAnimations({ subtree: true }).length,
          enLinea: el.getAttribute("style") || "",
          opacity: cs.opacity,
          willChange: cs.willChange,
          animationName: cs.animationName,
        };
      });
      anota(
        !r.overlay &&
          r.animaciones === 0 &&
          r.enLinea === "" &&
          r.opacity === "1" &&
          r.willChange === "auto" &&
          r.animationName === "none",
        `${vp.nombre} ${modo}: overlay fuera (${!r.overlay}) · ${r.animaciones} animaciones · ` +
          `style="${r.enLinea}" · opacity ${r.opacity} · will-change ${r.willChange} · animation-name ${r.animationName}`
      );
      await page.close();
    }
  }
}

async function main() {
  fs.mkdirSync(SALIDA, { recursive: true });
  const browser = await chromium.launch();
  try {
    await capturas(browser);
    await recargas(browser);
    await reducido(browser);
    await relevo(browser);
    await digital(browser);
    await fuente(browser);
    await puertaNombres(browser);
    await consola(browser);
    await geometria(browser);
    await escalabilidad(browser);
    await sinRastro(browser);
  } finally {
    await browser.close();
  }

  console.log("\n===== ACEPTACIÓN =====");
  linea.forEach((l) => console.log(l));
  if (fallos) {
    console.error(`\ncheck-apertura: ${fallos} línea(s) en NO.`);
    process.exit(1);
  }
  console.log("\ncheck-apertura: todo en SÍ.");
}

main().catch((err) => {
  console.error("check-apertura: error inesperado —", err);
  process.exit(1);
});
