// Fase 5 — genera las 4 evidencias "antes" (ficha de Google Maps) desde
// los originales en _trabajo/antes/, INTOCADOS. Recorte exacto en
// píxeles, verificado contra las cajas del Paso A: las cuatro salidas
// miden 921x1228 antes del resize final, ratio 3:4 (0.75) — igual al
// de las capturas ya recortadas de Vision Group y Alberto, así que esas
// dos no llevan recorte, solo resize. Salida: 792x1056 JPG calidad 88,
// más una variante WebP 528w (2x de la caja de presentación de 264px)
// para <picture> en móvil.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const OBRAS_JS = path.join(root, "src", "data", "obras.js");

const ANCHO_SALIDA = 792;
const ALTO_SALIDA = 1056;
const ANCHO_MOVIL = 528;
const CALIDAD_JPG = 88;
const CALIDAD_WEBP = 82;

const FUENTES = {
  "vision-group-building": {
    origen: "_trabajo/antes/caso-vision-group-antes.png",
    recorte: null,
  },
  "alberto-medina": {
    origen: "_trabajo/antes/caso-alberto-antes.png",
    recorte: null,
  },
  "fachadas-ventiladas-vision": {
    origen: "_trabajo/antes/fachadas-crudo.jpeg",
    recorte: { left: 0, top: 212, width: 921, height: 1440 - 212 },
  },
  "soul-barber-studio": {
    origen: "_trabajo/antes/soul-crudo.jpeg",
    recorte: { left: 0, top: 192, width: 921, height: 1420 - 192 },
  },
};

function leerObras() {
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
    const fuente = FUENTES[obra.slug];
    if (!fuente) throw new Error(`generar-antes: no hay fuente definida para "${obra.slug}"`);

    if (!obra.antes) throw new Error(`obras.js: falta el campo "antes" en "${obra.slug}"`);
    if (!obra.antesWebp528) throw new Error(`obras.js: falta el campo "antesWebp528" en "${obra.slug}"`);

    const destinoJpg = path.join(root, "public", obra.antes.replace(/^\//, ""));
    const destinoWebp = path.join(root, "public", obra.antesWebp528.replace(/^\//, ""));

    // _trabajo/ no se versiona: en CI los originales no existen, pero las
    // salidas sí están commiteadas. Se salta el paso; solo es un error si
    // además falta la salida.
    const origen = path.join(root, fuente.origen);
    if (!fs.existsSync(origen)) {
      if (fs.existsSync(destinoJpg) && fs.existsSync(destinoWebp)) {
        console.log(`sin original (${fuente.origen}), se reutiliza lo ya generado para "${obra.slug}"`);
        continue;
      }
      console.error(`falta el original y no hay salida previa: ${origen}`);
      process.exitCode = 1;
      continue;
    }

    fs.mkdirSync(path.dirname(destinoJpg), { recursive: true });
    fs.mkdirSync(path.dirname(destinoWebp), { recursive: true });

    let base = sharp(origen);
    if (fuente.recorte) base = base.extract(fuente.recorte);

    const buffer = await base.resize(ANCHO_SALIDA, ALTO_SALIDA).toBuffer();

    const meta = await sharp(buffer).metadata();
    if (meta.width !== ANCHO_SALIDA || meta.height !== ALTO_SALIDA) {
      throw new Error(
        `generar-antes: "${obra.slug}" salió a ${meta.width}x${meta.height}, se esperaba ${ANCHO_SALIDA}x${ALTO_SALIDA}`
      );
    }

    await sharp(buffer).jpeg({ quality: CALIDAD_JPG }).toFile(destinoJpg);
    console.log(`${path.relative(root, destinoJpg)} (${meta.width}x${meta.height})`);
    generadas++;

    await sharp(buffer).resize({ width: ANCHO_MOVIL }).webp({ quality: CALIDAD_WEBP }).toFile(destinoWebp);
    console.log(path.relative(root, destinoWebp));
    generadas++;
  }

  console.log(`generar-antes: ${generadas} ficheros generados.`);
}

generar();
