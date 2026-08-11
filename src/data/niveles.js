/* ============================================================
   KBTK Digital — niveles.js
   Fuente única de datos de S4. Añadir un nivel futuro = añadir un
   objeto a NIVELES y su valor en cada fila de DIFERENCIAS — cero
   cambios de layout en scripts/generar-niveles.mjs ni en el CSS.

   Reestructurado: 4 de las 9 filas originales eran idénticas en las
   tres columnas (46% del texto de la tabla) y la comparación real
   —02 vs 03— quedaba diluida. COMUNES se pinta una sola vez, a ancho
   completo, antes de la tabla. DIFERENCIAS es la tabla, y contiene
   SOLO lo que cambia de un nivel a otro.
   Donde dos niveles comparten valor en DIFERENCIAS (p. ej. PREVIO en
   oficio y flagship), el texto va escrito entero en los dos — nunca
   con "=", "—" ni una referencia al valor vecino: en una tabla de
   precios un guion se lee como "no incluido".
   ============================================================ */

const NIVELES = [
  {
    clave: "pagina",
    numero: "01",
    nombre: "PÁGINA",
    precio: "1.100 €",
    base: "909,09 € + 21 % IVA",
    destacado: false,
    orden: 1,
  },
  {
    clave: "oficio",
    numero: "02",
    nombre: "PÁGINA + OFICIO",
    precio: "1.800 €",
    base: "1.487,60 € + 21 % IVA",
    destacado: false,
    orden: 2,
  },
  {
    clave: "flagship",
    numero: "03",
    nombre: "FLAGSHIP",
    precio: "2.200 €",
    base: "1.818,18 € + 21 % IVA",
    destacado: true,
    orden: 3,
  },
];

// bloque común: idéntico en los tres niveles, se pinta UNA vez
const COMUNES = [
  {
    partida: "DISEÑO",
    texto: "Estructura, jerarquía y maquetación a medida del negocio. Nunca una plantilla adaptada.",
  },
  {
    partida: "COPY",
    texto: "Todos los textos escritos desde cero: titulares, cuerpo, botones y microcopia.",
  },
  {
    partida: "IMAGEN",
    texto: "Selección, recorte y tratamiento de la fotografía.",
  },
  {
    partida: "TÉCNICA",
    texto: "Web desplegada, dominio conectado, medición básica, formulario o WhatsApp, y velocidad revisada en móvil real.",
  },
  {
    partida: "ENTREGA",
    texto: "Código y accesos a nombre del cliente. Un pago. Sin cuota mensual y sin permanencia.",
  },
];

// lo que cambia de un nivel a otro — única razón de ser de la tabla.
// mono:true => la fila entera (partida + valores) va en Fragment Mono,
// no solo los números (CAMBIOS es la única, por diseño).
const DIFERENCIAS = [
  {
    partida: "PREVIO",
    mono: false,
    valores: {
      pagina: "Briefing a distancia",
      oficio: "Visita al local",
      flagship: "Visita al local",
    },
  },
  {
    partida: "FOTOGRAFÍA",
    mono: false,
    valores: {
      pagina: "La suya, tratada",
      oficio: "Sesión en el local, 2 h",
      flagship: "Sesión en el local, 2 h",
    },
  },
  {
    partida: "MOVIMIENTO",
    mono: false,
    valores: {
      pagina: "Entradas por sección",
      oficio: "Coreografía completa",
      flagship: "Coreografía completa, más una escena que se recuerda",
    },
  },
  {
    partida: "ALCANCE",
    mono: false,
    valores: {
      pagina: "Una página",
      oficio: "Una página",
      flagship: "Dos páginas, o dos idiomas",
    },
  },
  {
    partida: "CAMBIOS",
    mono: true,
    valores: {
      pagina: "1 ronda · 15 días",
      oficio: "2 rondas · 30 días",
      flagship: "3 rondas · 90 días",
    },
  },
];
