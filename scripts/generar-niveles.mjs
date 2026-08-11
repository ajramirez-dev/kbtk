// S4 (home) — igual que scripts/generar-indice.mjs con obras.js: lee
// src/data/niveles.js (NIVELES + COMUNES + DIFERENCIAS) e inyecta el
// HTML entre <!-- NIVELES:INICIO --> / <!-- NIVELES:FIN --> de
// src/index.html. Añadir un nivel futuro = añadir un objeto en
// niveles.js. Cero cambios de layout aquí ni en el CSS.
//
// Genera CUATRO bloques a partir de la MISMA fuente de datos:
//   1. .s4__comunes — lo que NO cambia entre niveles, a ancho completo,
//      UNA sola vez (no por columna): la razón de ser de la restructura.
//   2. .s4__selector — tres botones 01/02/03, solo visibles <1024px y
//      solo con JS ( .js .s4__selector, ver main.css). Sin JS no se
//      pinta: el botón no sirve de nada sin el script que lo escucha.
//   3. .s4__tabla — SOLO lo que cambia de un nivel a otro. Filas =
//      partidas, columnas = niveles. Visible >=1024px. Conserva las
//      clases .s4__tabla / .s4__fila: el reveal de scroll de main.js
//      engancha por esos nombres exactos, no por contenido.
//   4. .s4__niveles — el mismo contenido de DIFERENCIAS, apilado en 3
//      bloques (uno por nivel). <1024px sin JS: los tres se ven,
//      completos y legibles, apilados. <1024px con JS: main.js oculta
//      dos y anima el tercero, misma mecánica que el conmutador de S2.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const INDEX_HTML = path.join(root, "src", "index.html");
const NIVELES_JS = path.join(root, "src", "data", "niveles.js");

const INICIO = "<!-- NIVELES:INICIO -->";
const FIN = "<!-- NIVELES:FIN -->";

const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

function leerDatos() {
  const codigo = fs.readFileSync(NIVELES_JS, "utf8");
  const contexto = vm.createContext({});
  vm.runInContext(codigo, contexto);
  const NIVELES = vm.runInContext("NIVELES", contexto);
  const COMUNES = vm.runInContext("COMUNES", contexto);
  const DIFERENCIAS = vm.runInContext("DIFERENCIAS", contexto);
  if (!Array.isArray(NIVELES) || !NIVELES.length) {
    throw new Error(`No se encontró NIVELES como array en ${NIVELES_JS}`);
  }
  if (!Array.isArray(COMUNES) || !COMUNES.length) {
    throw new Error(`No se encontró COMUNES como array en ${NIVELES_JS}`);
  }
  if (!Array.isArray(DIFERENCIAS) || !DIFERENCIAS.length) {
    throw new Error(`No se encontró DIFERENCIAS como array en ${NIVELES_JS}`);
  }
  return { NIVELES: [...NIVELES].sort((a, b) => a.orden - b.orden), COMUNES, DIFERENCIAS };
}

function comunesHtml(comunes) {
  const filas = comunes
    .map(
      (c) => `          <div class="s4__comunes-fila">
            <dt class="t-data">${esc(c.partida)}</dt>
            <dd>${esc(c.texto)}</dd>
          </div>`
    )
    .join("\n");
  return `      <div class="s4__comunes col-span-12">
        <p class="t-data s4__bloque-eyebrow">EN LOS TRES NIVELES</p>
        <dl class="s4__comunes-lista">
${filas}
        </dl>
      </div>`;
}

function selectorHtml(niveles) {
  const activo = niveles.find((n) => n.destacado) || niveles[niveles.length - 1];
  const botones = niveles
    .map((n) => {
      const clase = n.clave === activo.clave ? "s4__selector-btn is-activo" : "s4__selector-btn";
      const seleccionado = n.clave === activo.clave ? "true" : "false";
      return `          <button type="button" class="${clase}" data-nivel-btn="${esc(n.clave)}" role="tab" aria-selected="${seleccionado}">${esc(n.numero)}</button>`;
    })
    .join("\n");
  return `      <div class="s4__selector t-data col-span-12" role="tablist" aria-label="Nivel" data-nivel-selector data-nivel-activo="${esc(activo.clave)}">
${botones}
      </div>`;
}

function cabeceraNivelHtml(n) {
  const claseDestacado = n.destacado ? " s4__th--destacado" : "";
  return `          <th class="s4__th${claseDestacado}" scope="col" data-nivel="${esc(n.clave)}">
            <span class="s4__th-numero t-data">NIVEL ${esc(n.numero)}</span>
            <span class="s4__th-nombre">${esc(n.nombre)}</span>
            <span class="s4__th-precio">${esc(n.precio)}</span>
            <span class="s4__th-base t-data">${esc(n.base)}</span>
          </th>`;
}

function tablaHtml(niveles, diferencias) {
  const cabeceras = niveles.map(cabeceraNivelHtml).join("\n");
  const cuerpo = diferencias
    .map((f) => {
      const clase = f.mono ? "s4__fila s4__fila--mono" : "s4__fila";
      const celdas = niveles
        .map((n) => `            <td data-nivel="${esc(n.clave)}">${esc(f.valores[n.clave])}</td>`)
        .join("\n");
      return `        <tr class="${clase}" data-mask>
          <th scope="row" class="t-data">${esc(f.partida)}</th>
${celdas}
        </tr>`;
    })
    .join("\n");

  return `      <p class="t-data s4__bloque-eyebrow col-span-12">LO QUE CAMBIA DE UN NIVEL A OTRO</p>

      <table class="s4__tabla col-span-12">
        <thead>
          <tr>
            <th class="t-data" scope="col">NIVEL</th>
${cabeceras}
          </tr>
        </thead>
        <tbody>
${cuerpo}
        </tbody>
      </table>`;
}

function nivelBloqueHtml(n, diferencias, activo) {
  const claseDestacado = n.destacado ? " s4__nivel--destacado" : "";
  const claseActiva = n.clave === activo.clave ? " is-activa" : "";
  const filasHtml = diferencias
    .map((f) => {
      const clase = f.mono ? "s4__nivel-fila s4__nivel-fila--mono" : "s4__nivel-fila";
      return `          <div class="${clase}">
            <dt class="t-data">${esc(f.partida)}</dt>
            <dd>${esc(f.valores[n.clave])}</dd>
          </div>`;
    })
    .join("\n");

  return `        <div class="s4__nivel${claseDestacado}${claseActiva}" data-nivel="${esc(n.clave)}">
          <header class="s4__nivel-cabecera">
            <span class="s4__nivel-numero t-data">NIVEL ${esc(n.numero)}</span>
            <h3 class="s4__nivel-nombre">${esc(n.nombre)}</h3>
            <p class="s4__nivel-precio">${esc(n.precio)}</p>
            <p class="s4__nivel-base t-data">${esc(n.base)}</p>
          </header>
          <dl class="s4__nivel-filas">
${filasHtml}
          </dl>
        </div>`;
}

function nivelesHtml(niveles, diferencias) {
  const activo = niveles.find((n) => n.destacado) || niveles[niveles.length - 1];
  const bloques = niveles.map((n) => nivelBloqueHtml(n, diferencias, activo)).join("\n");
  return `      <div class="s4__niveles col-span-12">
${bloques}
      </div>`;
}

function generar() {
  const { NIVELES, COMUNES, DIFERENCIAS } = leerDatos();

  const bloque = [
    comunesHtml(COMUNES),
    selectorHtml(NIVELES),
    tablaHtml(NIVELES, DIFERENCIAS),
    nivelesHtml(NIVELES, DIFERENCIAS),
  ].join("\n\n");

  const html = fs.readFileSync(INDEX_HTML, "utf8");
  const inicioIdx = html.indexOf(INICIO);
  const finIdx = html.indexOf(FIN);
  if (inicioIdx === -1 || finIdx === -1 || finIdx < inicioIdx) {
    throw new Error(`No se encontraron los marcadores ${INICIO} / ${FIN} en ${INDEX_HTML}`);
  }

  const antes = html.slice(0, inicioIdx + INICIO.length);
  const despues = html.slice(finIdx);
  const nuevo = `${antes}\n${bloque}\n${despues}`;

  fs.writeFileSync(INDEX_HTML, nuevo, "utf8");
  console.log(
    `generar-niveles: ${NIVELES.length} niveles · ${COMUNES.length} comunes · ${DIFERENCIAS.length} diferencias inyectados en ${path.relative(root, INDEX_HTML)}`
  );
}

generar();
