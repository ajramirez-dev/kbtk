// Fase 4.5 — A01: el índice de S2 se genera en el build, no en el
// cliente. Lee src/data/obras.js e inyecta el HTML de las filas —que
// son también las fichas móviles: mismo <li>, la diferencia es solo
// CSS— entre los marcadores <!-- OBRAS:INICIO --> / <!-- OBRAS:FIN -->
// de src/index.html. El JS de fase 4 deja de crear estas filas: a
// partir de aquí solo se engancha a lo que ya está en el HTML de origen.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const INDEX_HTML = path.join(root, "src", "index.html");
const OBRAS_JS = path.join(root, "src", "data", "obras.js");
const COPY_ES_JSON = path.join(root, "src", "contenido", "copy-es.json");

const INICIO = "<!-- OBRAS:INICIO -->";
const FIN = "<!-- OBRAS:FIN -->";
const S5_INICIO = "<!-- S5-FILA:INICIO -->";
const S5_FIN = "<!-- S5-FILA:FIN -->";

function leerObras() {
  const codigo = fs.readFileSync(OBRAS_JS, "utf8");
  const contexto = vm.createContext({});
  vm.runInContext(codigo, contexto);
  const OBRAS = vm.runInContext("OBRAS", contexto);
  if (!Array.isArray(OBRAS)) {
    throw new Error(`No se encontró OBRAS como array en ${OBRAS_JS}`);
  }
  return [...OBRAS].sort((a, b) => a.orden - b.orden);
}

const pad = (n) => String(n).padStart(2, "0");
const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

function filaHtml(obra, activa) {
  const esActiva = obra.slug === activa.slug;
  const clase = esActiva ? "s2__fila is-active" : "s2__fila";
  const estilo = esActiva
    ? ` style="--accent: var(${obra.accentVar}); --accent-ink: var(${obra.inkVar});"`
    : "";
  const carga = esActiva ? "eager" : "lazy";

  // data-fila-obra: marca las filas de obra REAL (generadas desde
  // obras.js), a diferencia de la quinta fila de S5 (E05), que usa el
  // mismo componente .s2__fila pero no representa ninguna obra.
  return `        <li class="${clase}" data-slug="${obra.slug}" data-fila-obra data-mask${estilo}>
          <a href="/obras/${obra.slug}/">
            <picture>
              <source type="image/webp" srcset="${obra.poster700} 700w, ${obra.poster1400} 1400w" sizes="350px">
              <img class="s2__fila-poster" src="${obra.poster}" alt="Captura de la web de ${esc(obra.nombre)}" width="1280" height="800" loading="${carga}">
            </picture>
            <span class="s2__num t-data">${pad(obra.orden)}</span>
            <span class="s2__nombre">${esc(obra.nombre)}</span>
            <span class="s2__meta t-data">${esc(obra.sector)} · ${esc(obra.estado)}</span>
          </a>
        </li>`;
}

function leerCopyEs() {
  return JSON.parse(fs.readFileSync(COPY_ES_JSON, "utf8"));
}

// E05: quinta fila de S5, mismo componente .s2__fila que el índice de
// S2 pero sin data-fila-obra (no es una obra) y sin data-slug (no hay
// conmutación posible). Nombre vacío + cursor mono parpadeando en vez
// de texto: no hay obra que enseñar todavía.
function filaS5Html(copy) {
  const fila = copy.s5.fila_05;
  return `        <li class="s2__fila s5__fila-obra">
          <a href="#contacto">
            <span class="s2__num t-data">${esc(fila.numero)}</span>
            <span class="s2__nombre s5__fila-nombre"><span class="s5__cursor" aria-hidden="true"></span></span>
            <span class="s2__meta t-data">${esc(fila.meta)}</span>
          </a>
        </li>`;
}

function generar() {
  const obras = leerObras();
  if (!obras.length) throw new Error("obras.js no contiene obras");
  const activa = obras.find((o) => o.orden === 1) || obras[0];
  const filas = obras.map((o) => filaHtml(o, activa)).join("\n");

  const html = fs.readFileSync(INDEX_HTML, "utf8");
  const inicioIdx = html.indexOf(INICIO);
  const finIdx = html.indexOf(FIN);
  if (inicioIdx === -1 || finIdx === -1 || finIdx < inicioIdx) {
    throw new Error(`No se encontraron los marcadores ${INICIO} / ${FIN} en ${INDEX_HTML}`);
  }

  const antes = html.slice(0, inicioIdx + INICIO.length);
  const despues = html.slice(finIdx);
  const conObras = `${antes}\n${filas}\n${despues}`;

  const copy = leerCopyEs();
  const filaS5 = filaS5Html(copy);
  const s5InicioIdx = conObras.indexOf(S5_INICIO);
  const s5FinIdx = conObras.indexOf(S5_FIN);
  if (s5InicioIdx === -1 || s5FinIdx === -1 || s5FinIdx < s5InicioIdx) {
    throw new Error(`No se encontraron los marcadores ${S5_INICIO} / ${S5_FIN} en ${INDEX_HTML}`);
  }
  const antesS5 = conObras.slice(0, s5InicioIdx + S5_INICIO.length);
  const despuesS5 = conObras.slice(s5FinIdx);
  const nuevo = `${antesS5}\n${filaS5}\n${despuesS5}`;

  fs.writeFileSync(INDEX_HTML, nuevo, "utf8");
  console.log(`generar-indice: ${obras.length} filas inyectadas en ${path.relative(root, INDEX_HTML)}`);
}

generar();
