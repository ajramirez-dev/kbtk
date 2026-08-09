// Fase 5 — genera las 4 páginas de obra (src/obras/[slug]/index.html)
// desde UNA plantilla única. Fuentes: src/data/obras.js (assets, acento,
// orden), src/contenido/obras/[slug].json (texto: problema, decisiones,
// ficha), src/contenido/copy-es.json bajo la clave "obra" (etiquetas
// fijas de la plantilla). Ninguna palabra de contenido se escribe aquí:
// si falta una clave, el build para con un error, no con un valor por
// defecto inventado.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const OBRAS_JS = path.join(root, "src", "data", "obras.js");
const CONTENIDO_DIR = path.join(root, "src", "contenido", "obras");
const COPY_ES = path.join(root, "src", "contenido", "copy-es.json");
const OUT_DIR = path.join(root, "src", "obras");

const BASE_URL = "https://kbtk.dev";

function leerObras() {
  const codigo = fs.readFileSync(OBRAS_JS, "utf8");
  const contexto = vm.createContext({});
  vm.runInContext(codigo, contexto);
  const OBRAS = vm.runInContext("OBRAS", contexto);
  if (!Array.isArray(OBRAS)) throw new Error(`No se encontró OBRAS como array en ${OBRAS_JS}`);
  return [...OBRAS].sort((a, b) => a.orden - b.orden);
}

function leerContenido(slug) {
  const ruta = path.join(CONTENIDO_DIR, `${slug}.json`);
  if (!fs.existsSync(ruta)) throw new Error(`falta el contenido de "${slug}": ${ruta}`);
  return JSON.parse(fs.readFileSync(ruta, "utf8"));
}

function leerCopyObra() {
  const copy = JSON.parse(fs.readFileSync(COPY_ES, "utf8"));
  if (!copy.obra) throw new Error(`copy-es.json: falta la clave "obra"`);
  return copy.obra;
}

const pad = (n) => String(n).padStart(2, "0");
const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

// campos que la plantilla necesita por obra en cada fuente — un fallo
// aquí para el build entero, en lugar de publicar un ".undefined" mudo.
const CAMPOS_OBRA = [
  "slug", "nombre", "sector", "estado", "accentVar", "inkVar",
  "poster", "poster700", "poster1400", "webm", "mp4",
  "antes", "antesWebp528", "anio", "orden",
];
const CAMPOS_CONTENIDO = ["meta_descripcion", "problema", "decisiones", "ficha"];
const CAMPOS_FICHA = ["estado", "sector", "alcance", "desplegada"];
const CAMPOS_COPY_OBRA = [
  "kicker_visor", "evidencia_kicker", "evidencia_pie", "problema_kicker",
  "decisiones_kicker", "ficha_kicker", "ficha_labels", "ph_desplegada",
  "siguiente_kicker", "siguiente_cta",
];

function validar(obra, contenido, copyObra) {
  for (const campo of CAMPOS_OBRA) {
    if (obra[campo] === undefined) throw new Error(`obras.js: falta "${campo}" en "${obra.slug}"`);
  }
  for (const campo of CAMPOS_CONTENIDO) {
    if (contenido[campo] === undefined) throw new Error(`${obra.slug}.json: falta "${campo}"`);
  }
  for (const campo of CAMPOS_FICHA) {
    if (contenido.ficha[campo] === undefined) throw new Error(`${obra.slug}.json: falta "ficha.${campo}"`);
  }
  if (contenido.decisiones.length !== 4) {
    throw new Error(`${obra.slug}.json: "decisiones" debe traer exactamente 4, trae ${contenido.decisiones.length}`);
  }
  for (const campo of CAMPOS_COPY_OBRA) {
    if (copyObra[campo] === undefined) throw new Error(`copy-es.json "obra": falta "${campo}"`);
  }
  const largo = contenido.meta_descripcion.length;
  if (largo < 150 || largo > 160) {
    throw new Error(`${obra.slug}.json: meta_descripcion mide ${largo} caracteres, debe estar entre 150 y 160`);
  }
}

// SVG del logotipo, idéntico al de src/index.html (misma barra de
// estado en las dos plantillas — copiado, no reinventado).
const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 -206 1255.787 298" role="img" aria-label="KBTK Digital"><g transform="matrix(2 0 0 2 0 -200)"><circle cx="50" cy="50" r="32.6" fill="none" stroke="currentColor" stroke-width="22.7"/><circle cx="50" cy="50" r="14.4" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="50" cy="50" r="7.5" fill="var(--obra-accent, currentColor)"/></g><path d="M283.853 0v-200.413h57.393v94.937l100.724-94.937h72.06l-86.888 82.38L515.926 0h-70.343L385.49-82.375l-44.244 36.92V0Zm257.39 0v-200.413H694.15q16.09 0 29.112 6.25 13.023 6.25 20.64 17.328 7.619 11.079 7.619 25.79 0 13.112-4.646 22.442-4.645 9.33-12.44 15.122-7.793 5.793-17.316 8.683v1.166q11.115 2.333 20.062 8.417 8.946 6.085 14.175 16.222t5.229 24.842q0 17.233-8.242 29.319T726.19-6.372 695.101 0Zm57.394-41.658h78.238q9.265 0 15.116-5.21 5.85-5.209 5.85-15.984 0-5.704-2.53-10.232t-7.42-7.032-11.889-2.504h-77.365Zm0-79.407h73.345q6.711 0 11.308-2.508 4.596-2.51 7.09-7.047 2.494-4.539 2.494-10.674 0-8.768-5.688-13.827-5.687-5.06-14.368-5.06h-74.181ZM852.956 0v-154.028h-80.728v-46.385H991.07v46.385h-80.721V0Zm164.293 0v-200.413h57.394v94.937l100.724-94.937h72.06l-86.889 82.38L1249.323 0h-70.344l-60.092-82.375-44.244 36.92V0Z"/><path d="M281.602 78h-16.166V28h16.166q6.367 0 10.587 3.219t6.33 8.834 2.11 12.911-2.11 12.947-6.33 8.87T281.602 78m-9.513-44.134v38.268h8.369q7.01 0 10.121-5.114t3.112-13.984q0-8.942-3.112-14.056t-10.121-5.114ZM316.36 78v-5.58h10.586V33.58H316.36V28h27.968v5.58H333.67v38.84h10.658V78Zm63.299-26.466h17.238V78h-4.864l-.572-6.867q-1.788 4.22-5.043 6.187t-7.475 1.968q-6.008 0-10.372-3.076t-6.76-8.87-2.396-14.02q0-8.512 2.54-14.414 2.539-5.9 7.081-8.977 4.542-3.075 10.623-3.075 6.58 0 11.194 3.505t6.187 11.444h-6.795q-1.001-5.15-3.827-7.117t-6.76-1.967q-6.58 0-9.942 5.472t-3.362 14.771q0 10.444 3.505 15.45 3.505 5.008 9.227 5.008 4.15 0 6.796-1.931t3.898-5.258 1.252-7.403V57.4H379.66ZM412.773 78v-5.58h10.586V33.58h-10.586V28h27.968v5.58h-10.658v38.84h10.658V78Zm80.466-44.134h-14.95V78h-6.652V33.866h-15.022V28h36.624ZM536.152 78l-4.435-14.95h-17.24L510.044 78h-6.867l15.808-50h8.37l15.736 50Zm-20.029-20.53h13.949l-7.01-23.461ZM558.106 28h6.652v44.134h23.82V78h-30.472Z"/></svg>`;

function barraEstado(copy) {
  return `  <header data-seccion="s0" class="status-bar">
    <div class="status-bar__grid">
      <a class="status-bar__brand no-grain" href="/" aria-label="KBTK Digital — inicio">${LOGO_SVG}</a>
      <p class="status-bar__meta t-data">${esc(copy.s0.meta_obras)}</p>
      <div class="status-bar__actions">
        <p class="status-bar__lang t-data"><span aria-current="page">ES</span> / <a href="/en/">EN</a></p>
        <a class="status-bar__cta t-data" href="/#contacto">${esc(copy.s0.cta_contacto)}</a>
      </div>
    </div>
  </header>`;
}

function cabecera(obra, contenido, copyObra) {
  const nota = obra.notaConstruccion
    ? `\n        <p class="obra-cabecera__nota t-data">${esc(obra.notaConstruccion)}</p>`
    : "";
  return `    <header class="obra-cabecera">
      <div class="obra-cabecera__inner">
        <p class="t-data obra-cabecera__kicker">OBRA ${pad(obra.orden)} · ${esc(obra.sector)}</p>
        <h1 class="t-display obra-cabecera__nombre" data-line-reveal>${esc(obra.nombre)}</h1>
        <dl class="obra-cabecera__meta t-data">
          <div><dt>SECTOR</dt><dd>${esc(obra.sector)}</dd></div>
          <div><dt>ESTADO</dt><dd>${esc(obra.estado)}</dd></div>
          <div><dt>AÑO</dt><dd>${esc(obra.anio)}</dd></div>
        </dl>${nota}
      </div>
    </header>`;
}

function visor(obra, copyObra) {
  // sizes real: en escritorio el visor mide 1360px (--content-max).
  // Por debajo de 1024px va a sangre menos 2x --edge (20-40px por
  // lado) dentro de .obra-visor, NUNCA 100vw — con 100vw el visor
  // pedía de más y el srcset (700w/1400w) redondeaba hacia el 1400w
  // incluso en móviles estrechos, inflando el peso de la imagen LCP.
  return `    <section class="obra-visor" aria-label="${esc(copyObra.kicker_visor)}">
      <div class="obra-visor__marco" data-obra-visor data-webm="${obra.webm}" data-mp4="${obra.mp4}">
        <picture>
          <source type="image/webp" srcset="${obra.poster700} 700w, ${obra.poster1400} 1400w" sizes="(min-width: 1024px) 1360px, calc(100vw - 80px)">
          <img class="obra-visor__poster" src="${obra.poster}" alt="Captura de la web de ${esc(obra.nombre)}" width="1280" height="800" loading="eager" fetchpriority="high">
        </picture>
      </div>
    </section>`;
}

function evidencia(obra, copyObra) {
  if (!obra.antes) return "";
  return `    <section class="obra-evidencia" data-mask>
      <p class="t-data obra-evidencia__kicker">${esc(copyObra.evidencia_kicker)}</p>
      <figure class="obra-evidencia__figura">
        <picture>
          <source type="image/webp" srcset="${obra.antesWebp528} 528w" sizes="264px">
          <img src="${obra.antes}" alt="Ficha de Google Maps de ${esc(obra.nombre)}, sin sitio web" width="792" height="1056" loading="lazy">
        </picture>
        <figcaption class="t-data">${esc(copyObra.evidencia_pie)}</figcaption>
      </figure>
    </section>`;
}

function problema(contenido, copyObra) {
  return `    <section class="obra-problema">
      <p class="t-data obra-problema__kicker">${esc(copyObra.problema_kicker)}</p>
      <p class="obra-problema__texto">${esc(contenido.problema)}</p>
    </section>`;
}

function decisiones(contenido, copyObra) {
  const items = contenido.decisiones
    .map(
      (d, i) => `        <li>
          <span class="t-data obra-decisiones__numero">${pad(i + 1)}</span>
          <h3 class="obra-decisiones__titulo">${esc(d.titulo)}</h3>
          <p class="obra-decisiones__cuerpo">${esc(d.cuerpo)}</p>
        </li>`
    )
    .join("\n");
  return `    <section class="obra-decisiones">
      <p class="t-data obra-decisiones__kicker">${esc(copyObra.decisiones_kicker)}</p>
      <ol class="obra-decisiones__lista">
${items}
      </ol>
    </section>`;
}

function ficha(contenido, copyObra) {
  const f = contenido.ficha;
  const desplegadaValor = f.desplegada
    ? esc(f.desplegada)
    : `<span class="ph">${esc(copyObra.ph_desplegada)}</span><!-- TODO: ${esc(f._todo_desplegada || "")} -->`;

  return `    <section class="obra-ficha">
      <p class="t-data obra-ficha__kicker">${esc(copyObra.ficha_kicker)}</p>
      <dl class="obra-ficha__lista">
        <div class="obra-ficha__par"><dt class="t-data">${esc(copyObra.ficha_labels.estado)}</dt><dd class="t-data">${esc(f.estado)}</dd></div>
        <div class="obra-ficha__par"><dt class="t-data">${esc(copyObra.ficha_labels.sector)}</dt><dd class="t-data">${esc(f.sector)}</dd></div>
        <div class="obra-ficha__par"><dt class="t-data">${esc(copyObra.ficha_labels.alcance)}</dt><dd class="t-data">${esc(f.alcance)}</dd></div>
        <div class="obra-ficha__par"><dt class="t-data">${esc(copyObra.ficha_labels.desplegada)}</dt><dd class="t-data">${desplegadaValor}</dd></div>
      </dl>
    </section>`;
}

function siguienteObra(obras, obra, copyObra) {
  const idx = obras.findIndex((o) => o.slug === obra.slug);
  const siguiente = obras[(idx + 1) % obras.length];
  return `  <footer class="obra-siguiente" style="--accent: var(${siguiente.accentVar});">
    <div class="obra-siguiente__inner">
      <p class="t-data obra-siguiente__kicker">${esc(copyObra.siguiente_kicker)}</p>
      <a class="obra-siguiente__link" href="/obras/${siguiente.slug}/">
        <span class="t-display obra-siguiente__nombre" data-line-reveal>${esc(siguiente.nombre)}</span>
      </a>
    </div>
  </footer>`;
}

function jsonLd(obra, contenido) {
  const data = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: obra.nombre,
    description: contenido.meta_descripcion,
    image: `${BASE_URL}${obra.poster1400}`,
    url: `${BASE_URL}/obras/${obra.slug}/`,
    genre: obra.sector,
    dateCreated: String(obra.anio),
    creator: { "@type": "Organization", name: "KBTK Digital", url: BASE_URL },
  };
  // JSON.stringify escapa comillas dobles; "</script>" en el texto
  // rompería el documento igualmente, así que se neutraliza aquí.
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

function pagina(obras, obra, contenido, copy, copyObra) {
  const url = `${BASE_URL}/obras/${obra.slug}/`;
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(obra.nombre)} — Caso de estudio · KBTK Digital</title>
  <meta name="description" content="${esc(contenido.meta_descripcion)}">
  <link rel="canonical" href="${url}">
  <meta property="og:type" content="article">
  <meta property="og:locale" content="es_ES">
  <meta property="og:site_name" content="KBTK Digital">
  <meta property="og:url" content="${url}">
  <meta property="og:title" content="${esc(obra.nombre)} — Caso de estudio · KBTK Digital">
  <meta property="og:description" content="${esc(contenido.meta_descripcion)}">
  <meta property="og:image" content="${BASE_URL}/og/og-${obra.slug}-v1.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${esc(obra.nombre)} — caso de estudio de KBTK Digital">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="theme-color" content="#08090B">
  <link rel="icon" href="/favicon.ico" sizes="32x32">
  <link rel="icon" type="image/png" href="/icon-32.png" sizes="32x32">
  <link rel="icon" type="image/png" href="/icon-512-maskable.png" sizes="512x512">
  <link rel="apple-touch-icon" href="/apple-touch-icon-180.png">
  <link rel="manifest" href="/manifest.webmanifest">
  <script>
    document.documentElement.classList.add("js");
  </script>
  <link rel="stylesheet" href="/css/tokens.min.css">
  <link rel="stylesheet" href="/css/main.min.css">
  <script src="/data/obras.js"></script>
  <script>
    (function () {
      var root = document.documentElement.style;
      root.setProperty("--obra-accent", "var(${obra.accentVar})");
      root.setProperty("--obra-ink", "var(${obra.inkVar})");
    })();
  </script>
  <script src="/js/main.min.js" defer></script>
  <script type="application/ld+json">${jsonLd(obra, contenido)}</script>
</head>
<body class="pagina-obra" data-slug="${obra.slug}">

  <div class="acento-transicion" aria-hidden="true"></div>

  <div class="grain-overlay" aria-hidden="true"></div>

  <a class="skip-link" href="#main">Saltar al contenido</a>

${barraEstado(copy)}

  <main id="main">
${cabecera(obra, contenido, copyObra)}
${visor(obra, copyObra)}
${evidencia(obra, copyObra)}
${problema(contenido, copyObra)}
${decisiones(contenido, copyObra)}
${ficha(contenido, copyObra)}
  </main>

${siguienteObra(obras, obra, copyObra)}

</body>
</html>
`;
}

function generar() {
  const obras = leerObras();
  const copy = JSON.parse(fs.readFileSync(COPY_ES, "utf8"));
  const copyObra = leerCopyObra();

  for (const obra of obras) {
    const contenido = leerContenido(obra.slug);
    validar(obra, contenido, copyObra);

    const html = pagina(obras, obra, contenido, copy, copyObra);
    const dir = path.join(OUT_DIR, obra.slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "index.html"), html, "utf8");
    console.log(path.relative(root, path.join(dir, "index.html")));
  }

  console.log(`generar-obras: ${obras.length} páginas generadas.`);
}

generar();
