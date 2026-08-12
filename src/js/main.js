/* ============================================================
   KBTK Digital — apertura de la home
   1700 ms exactos, en CADA carga de "/" y solo ahí: llegar a una
   obra desde el índice y comerse la cortina otra vez rompería el
   momento estrella, así que el enganche es la existencia de
   #apertura, que solo sirve src/index.html. Sin sessionStorage.

   EL CONTRATO DEL LCP MANDA SOBRE TODO LO DEMÁS
   El overlay ya está en el DOM cuando corre esto: es markup servido,
   con sus estilos EN LÍNEA en el <head> y antes de la hoja de
   estilos (index.html). Aquí no se crea la cortina, solo se anima.
   El H1 de S1 se pinta normal, detrás, desde el primer fotograma: no
   se toca ni se retrasa. El overlay es position:fixed —fuera de
   flujo, CLS intacto— y solo se animan transform, opacity y
   clip-path. Ni una propiedad que provoque layout.

   POR QUÉ WAAPI Y NO GSAP NI @keyframes
   1. transform/opacity van al compositor.
   2. Las conmutaciones duras se expresan con steps(1, jump-end) como
      fotogramas clave, así que no hay un solo setTimeout que pueda
      derivar: el barrido es exacto por construcción.
   3. Todas comparten la MISMA línea de tiempo del documento y el mismo
      startTime, y cada una está acotada a su propia ventana (delay +
      duration). Consecuencia directa: el relevo del logotipo ocurre en
      UN fotograma, porque las dos opacidades —vector a 0 y logotipo
      real a 1— son cortes en el mismo instante de esa línea de tiempo,
      no dos callbacks que se persiguen.
   4. document.getAnimations() permite buscar un instante exacto, que
      es lo que hace verificables las capturas (scripts/check-apertura.mjs).
   GSAP no entra: en móvil no se carga nunca (fase 4.5, A02) y la
   apertura es idéntica en los dos viewports.

   LOS DATOS NO SE ESCRIBEN AQUÍ
   Las obras salen de OBRAS (data/obras.js, ya cargado síncrono en el
   <head>) y los acentos se leen de tokens.css POR SU NOMBRE, el que
   trae cada obra en accentVar. Ni un hex, ni un nombre de obra en
   este fichero: añadir la obra 05 no toca ni una línea de aquí, solo
   cambia ms_por_obra = 500 / obras.length.
   ============================================================ */
(function () {
  "use strict";

  const raiz = document.getElementById("apertura");
  if (!raiz) return; // no es la home

  const HECHA = "apertura-hecha";
  function cerrar() {
    // La clase suelta al logotipo real del header (index.html, bloque
    // en línea) y el overlay se ELIMINA del DOM, no se deja en
    // display:none. Idempotente: la red de seguridad de 3s del <head>
    // llama a lo mismo.
    document.documentElement.classList.add(HECHA);
    raiz.remove();
  }

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    cerrar(); // el CSS ya lo tenía en display:none; esto solo limpia
    return;
  }

  const cs = getComputedStyle(document.documentElement);
  const tk = (nombre) => cs.getPropertyValue(nombre).trim();

  /* ---------- Contrato: colores y curvas, leídos por nombre ---------- */
  const W1 = tk("--w1");
  const W2 = tk("--w2");
  const G1 = tk("--g1");
  const ACENTO_ACTIVO = tk("--obra-accent"); // el del núcleo del logotipo real
  const EASE_OUT = tk("--ease-out");   // entrada rápida, frenada seca
  const EASE_MECH = tk("--ease-mech"); // conmutador, sin rebote

  /* ---------- Guion, en ms. Total 1700, exacto ----------
     Las duraciones de la apertura NO viven en tokens.css a propósito:
     ese fichero es el contrato de diseño del sitio y su diff literal
     contra docs/tokens-v3.css es una invariante del flujo. */
  const TOTAL = 1700;
  const T = {
    entradaLinea: 260,   // la línea entra desde el borde izquierdo
    finBarrido: 500,     // fase 1 · el canal recorre el índice entero
    apagadoNombre: 560,  // el nombre se apaga en 60 ms
    finColapso: 900,     // fase 2 · la línea se contrae en su punto medio
    aroVisible: 900,     // fase 3 · el aro aparece de golpe en --w2
    kbtkIn: 920,
    nucleoBlanco: 1060,  // un color -> blanco, 160 ms. Nunca dos a la vez
    nucleoPequeno: 1140,
    finAnillo: 1200,     // el anillo de 1px muere
    digital: 1170,
    cortina: 1200,       // fase 4
    virajeIn: 1520,      // el vector se iguala al logotipo real...
    virajeOut: 1600,     // ...y termina ANTES del relevo
    relevo: 1640,
  };

  /* ---------- Geometría del lockup ----------
     Idéntica a la del logotipo del header (index.html): mismo viewBox,
     mismos círculos, mismas trayectorias. Eso es lo que hace posible
     el relevo a píxel. Verificado contra el DOM: el matrix(2 0 0 2 0
     -200) del header sobre cx 50 · cy 50 · r 32.6 · sw 22.7 da
     exactamente el aro exterior cx 100 · cy -100 · r 65.2 · sw 45.4, y
     el anillo interior r 28.8 · sw 3.6. El núcleo real es r 15. */
  const VB_W = 1255.787;
  const VB_H = 298;
  const SYM_X = 100;  // centro del testigo en el eje x del viewBox
  const SYM_Y = 106;  // ...y en el eje y, medido desde el borde superior
  const ARO_R = 65.2;
  const NUCLEO_R = 15;

  const caja = raiz.getBoundingClientRect();
  const vw = caja.width;
  const vh = caja.height;

  /* Un solo corte para toda la apertura (largo de la línea y número de
     columnas de la cortina). Se repite en el <style> en línea de
     index.html y las dos copias tienen que decir lo mismo, carácter a
     carácter. */
  const ANCHO_GRANDE = window.matchMedia("(min-width: 768px)").matches;

  // Una sola fórmula reproduce los dos tamaños medidos del boceto:
  // 1440 -> 628 px de lockup (escala 0.5) y 390 -> 251.2 (escala 0.2).
  // Verificado contra el DOM: da cx 456.0 a 1440 y cx 89.4 a 390.
  const anchoLockup = Math.min(628, vw * 0.644);
  const sHero = anchoLockup / VB_W;
  const cxHero = (vw - anchoLockup) / 2 + SYM_X * sHero;
  const cyHero = vh / 2;

  /* Los dos valores medidos del boceto: media línea de 230 px a 1440 y
     de 78 px a 390. No es una proporción única porque a 390 no cabría:
     con el 0.366 de escritorio, FACHADAS VENTILADAS VISIÓN se sale del
     hueco por 8.8 px en Fragment Mono (medido) — y por menos de 0 en el
     respaldo monoespaciado, con lo que caber o no dependería de si la
     fuente ya ha pintado. La puerta la vigila scripts/check-apertura.mjs:
     una obra futura con nombre largo falla en rojo, no desborda en
     silencio. */
  const medioLargo = (ANCHO_GRANDE ? 0.366 : 0.311) * anchoLockup;

  const logoReal = document.querySelector(".status-bar__brand");

  const situar = (cx, cy, s) =>
    `translate(${cx - SYM_X * s}px, ${cy - SYM_Y * s}px) scale(${s})`;

  /* ---------- Los registros ---------- */
  const obras = [...OBRAS].sort((a, b) => a.orden - b.orden);
  const acentos = obras.map((ob) => tk(ob.accentVar));
  const msPorObra = T.finBarrido / obras.length; // 4 -> 125 · 10 -> 50

  /* ---------- Piezas ----------
     El lockup se clona de su <template>: hasta aquí era contenido
     inerte, fuera del primer pintado. Ver el comentario del template en
     index.html. */
  raiz.appendChild(document.getElementById("apertura-lockup").content.cloneNode(true));

  const canal = raiz.querySelector(".apertura__canal");
  const linea = raiz.querySelector(".apertura__linea");
  const nombres = raiz.querySelector(".apertura__nombres");
  const lockup = raiz.querySelector(".apertura__lockup");
  const aro = raiz.querySelector(".apertura__aro");
  const nucleo = raiz.querySelector(".apertura__nucleo");
  const pulso = raiz.querySelector(".apertura__pulso");
  const kbtk = raiz.querySelector(".apertura__kbtk");
  const digital = raiz.querySelector(".apertura__digital");

  /* El anillo ya NO usa vector-effect="non-scaling-stroke". Mantener el
     trazo a 1 px mientras el círculo se escala obliga a rehacer su
     geometría en cada fotograma —56 eventos de maquetación él solo,
     medidos— y el ancho constante no era un requisito, solo la forma
     más cómoda de escribirlo. Se fija una vez, en unidades del viewBox,
     para que a scale(1) mida exactamente 1 px en pantalla. */
  pulso.setAttribute("stroke-width", (1 / sHero).toFixed(3));

  linea.style.left = `${cxHero - medioLargo}px`;
  linea.style.top = `${cyHero - 1}px`;
  linea.style.width = `${medioLargo * 2}px`;

  // Un <span> por registro, apilados: solo uno visible por vez. Así el
  // barrido no toca textContent ni depende de un temporizador.
  nombres.style.left = `${cxHero + medioLargo + 16}px`;
  nombres.style.top = `${cyHero - 5}px`;
  const rotulos = obras.map((ob, i) => {
    const span = document.createElement("span");
    span.textContent = ob.nombre;
    span.style.color = acentos[i];
    nombres.appendChild(span);
    return span;
  });
  const colaNombre = rotulos.reduce((max, s) => Math.max(max, s.offsetWidth), 0);

  /* ---------- Fase 4 · la cortina: la rejilla del sitio ----------
     Doce columnas iguales en escritorio, cuatro por debajo de 768px.
     Los números salen de que la fase dura 500 ms EXACTOS:
       escritorio  11 escalones x 24 + 236 = 500
       móvil        3 escalones x 80 + 260 = 500
     El escalón de escritorio no es de 40 ms: con 12 columnas, 11 x 40
     dejarían 60 ms de recorrido por columna y la cortina no se leería
     como un movimiento, sino como un parpadeo. */
  const COLS = ANCHO_GRANDE ? 12 : 4;
  const PASO = COLS === 12 ? 24 : 80;
  const RECORRIDO = COLS === 12 ? 236 : 260;
  const columnas = [...raiz.querySelectorAll(".apertura__cortina i")].slice(0, COLS);

  /* ---------- El guion, en fotogramas clave ----------
     NINGUNA animación dura los 1700 ms: cada una vive exactamente su
     ventana con tramo(desde, hasta) —o 1 ms con corte(ms) si lo suyo es
     un salto— sobre la misma línea de tiempo. Solo la maestra ocupa el
     total, y no pinta nada: es el reloj.

     Y es una decisión MEDIDA, aplicada a TODAS: una animación en curso paga
     recálculo de estilo y —si toca una propiedad no componible, o si el
     objetivo es hijo de un SVG— repintado en el hilo principal en CADA
     fotograma que esté activa, cambie de valor o no; y las columnas
     mantienen una capa promocionada mientras dure la suya. Dejarlas
     vivas los 1700 ms costaba: TBT de la home 34 ms -> 212 ms y la
     mediana de Performance por debajo del umbral de 90 de CLAUDE.md.
     Acotada cada una a su propia ventana con tramo(), el resultado en
     pantalla es idéntico —el relleno hacia atrás y hacia delante da los
     mismos valores fuera de ella— y el trabajo desaparece.
     Buscar un instante sigue funcionando porque __aperturaSeek resta el
     retardo de cada animación. */
  const comun = { duration: TOTAL, fill: "both" };
  const tramo = (desde, hasta) => ({ delay: desde, duration: hasta - desde });
  /* Un corte duro EN un instante: la animación solo está viva 1 ms. El
     valor de antes lo pone el CSS —"forwards" no rellena hacia atrás— y
     el de después lo deja el relleno hacia delante. Es la forma más
     barata de escribir "esto cambia aquí y nunca más".
     La ventana empieza EN ms y el salto es jump-start, no jump-end:
     medido, un tramo [ms-1, ms] con jump-end deja el valor viejo en el
     propio ms y cambia en ms+1 —DIGITAL encendía a 1171—, mientras que
     jump-start entrega el valor nuevo en el primer instante del tramo,
     que es exactamente ms. */
  const corte = (ms) => ({ delay: ms, duration: 1, fill: "forwards" });
  const SALTO = "steps(1, jump-end)";       // cambia al FINAL del tramo
  const SALTO_YA = "steps(1, jump-start)";  // ...o en su primer instante
  const anim = [];
  const mover = (el, kfs, extra) => {
    const a = el.animate(kfs, Object.assign({}, comun, extra));
    anim.push(a);
    return a;
  };

  /* Y en cuanto una pieza termina lo suyo, deja de existir para el
     motor: display:none la saca del árbol de cajas —ni maquetación, ni
     pintado, ni capa— y a los 1700 ms cerrar() saca del DOM el overlay
     entero. Acotar la animación quita el trabajo por fotograma; esto
     quita lo que cuesta seguir estando.
     Con ?apertura=freeze las animaciones están PAUSADAS y nunca
     "terminan", así que la verificación sigue viendo la apertura
     completa en cualquier instante. */
  const apagarAlTerminar = (el, a) => {
    a.finished.then(() => { el.style.display = "none"; }, () => {});
  };

  // FASE 1 · EL CANAL — el grupo entero entra desde fuera del borde
  // izquierdo y se queda. Se queda QUIETO desde los 260 ms: la animación
  // termina ahí, no a los 1700.
  mover(canal, [
    { transform: `translateX(${-(cxHero + medioLargo + colaNombre + 16)}px)`, easing: EASE_OUT },
    { transform: "translateX(0)" },
  ], tramo(0, T.entradaLinea));

  // Conmutación del color de la línea: un corte por registro, sin
  // fundido. Es un conmutador, no un crossfade.
  mover(
    linea,
    [
      ...acentos.map((c, i) => ({
        backgroundColor: c,
        offset: (i * msPorObra) / T.finBarrido,
        easing: "steps(1, jump-end)",
      })),
      { backgroundColor: acentos[acentos.length - 1], offset: 1 },
    ],
    tramo(0, T.finBarrido)
  );

  // Cada rótulo, encendido solo en su ranura. El último se queda hasta
  // los 500 ms y se apaga en 60. Los cuatro viven en la ventana del
  // barrido —0 a 560— y no un milisegundo más.
  const enNombre = (ms) => ms / T.apagadoNombre;
  rotulos.forEach((span, i) => {
    const ultimo = i === obras.length - 1;
    const kfs = [];
    if (i > 0) kfs.push({ opacity: 0, offset: 0, easing: SALTO });
    kfs.push({ opacity: 1, offset: enNombre(i * msPorObra), easing: SALTO });
    if (ultimo) {
      kfs.push({ opacity: 1, offset: enNombre(T.finBarrido), easing: "linear" });
      kfs.push({ opacity: 0, offset: 1, easing: SALTO });
    } else {
      kfs.push({ opacity: 0, offset: enNombre((i + 1) * msPorObra), easing: SALTO });
      kfs.push({ opacity: 0, offset: 1 });
    }
    mover(span, kfs, tramo(0, T.apagadoNombre));
  });

  // FASE 2 · EL COLAPSO — la línea se contrae hacia su punto medio, que
  // es exactamente donde va a aparecer el aro. A los 900 ms el canal
  // entero —línea y los cuatro rótulos— ya no pinta nada: se apaga.
  const colapso = mover(linea, [
    { transform: "scaleX(1)", easing: EASE_OUT },
    { transform: "scaleX(0)" },
  ], tramo(T.finBarrido, T.finColapso));
  apagarAlTerminar(canal, colapso);

  // FASE 3 · LA FUSIÓN — el aro aparece de golpe a los 900 ms, y el
  // vector se apaga en el fotograma del relevo. Dos cortes de 1 ms en
  // vez de una opacidad viva 1700: entre medias el valor no cambia, y
  // el CSS ya deja el lockup en opacity 0 hasta el primero.
  mover(lockup, [{ opacity: 0, easing: SALTO_YA }, { opacity: 1 }], corte(T.aroVisible));
  const salidaLockup = mover(lockup, [{ opacity: 1, easing: SALTO_YA }, { opacity: 0 }], corte(T.relevo));
  apagarAlTerminar(lockup, salidaLockup);

  mover(
    aro,
    [
      { stroke: W2, offset: 0, easing: "steps(1, jump-end)" },
      { stroke: W1, offset: 1 },
    ],
    tramo(T.aroVisible, T.nucleoBlanco)
  );

  /* El núcleo entra con el color del ÚLTIMO registro del barrido y
     alcanza temperatura: un filamento, un solo color a blanco. En ningún
     fotograma hay dos colores. Al final toma --obra-accent, que es con
     lo que el header real pinta su núcleo — sin eso, el relevo no
     coincidiría.
     El color y la escala van SEPARADOS a propósito: la escala es
     componible y el color no, y un solo efecto con las dos habría
     bajado la escala al hilo principal durante toda la ventana.
     Y son DOS animaciones, no una de 900 a 1600: entre los 1060 y los
     1520 el color es blanco y no se mueve. Una sola ventana mantenía
     460 ms de repintado por fotograma para pintar siempre lo mismo. */
  const ultimoAcento = acentos[acentos.length - 1];
  const relleno = { fill: "forwards" }; // "fill" aquí es el modo de relleno
  mover(
    nucleo,
    [{ fill: ultimoAcento, easing: "linear" }, { fill: W1 }],
    Object.assign(tramo(T.aroVisible, T.nucleoBlanco), relleno)
  );
  mover(
    nucleo,
    [{ fill: W1, easing: "linear" }, { fill: ACENTO_ACTIVO }],
    Object.assign(tramo(T.virajeIn, T.virajeOut), relleno)
  );
  mover(nucleo, [
    { transform: "scale(1.8)", easing: EASE_OUT },
    { transform: "scale(1)" },
  ], tramo(T.nucleoBlanco, T.nucleoPequeno));

  // Un anillo de 1 px que sale del núcleo y muere a ~1,9 veces el radio
  // del aro. Anillo, no fogonazo relleno. Vive 140 ms y se apaga: fuera
  // de su ventana el CSS ya lo deja en opacity 0, así que no necesita
  // relleno ninguno.
  const anillo = mover(
    pulso,
    [
      { opacity: 1, transform: `scale(${NUCLEO_R / ARO_R})`, easing: EASE_OUT },
      { opacity: 0, transform: "scale(1.9)" },
    ],
    Object.assign(tramo(T.nucleoBlanco, T.finAnillo), { fill: "none" })
  );
  apagarAlTerminar(pulso, anillo);

  /* KBTK se descubre de abajo arriba. Los dos porcentajes salen de la
     altura de caja alta (200.413) sobre el viewBox de 298.
     Esto sigue animando clip-path a sabiendas. Se intentó cambiarlo por
     transform de las dos formas que conservan las letras quietas —grupo
     recortado con otro dentro compensando el desplazamiento, y recorte
     fijo con la ventana moviéndose— y las dos reproducen el revelado
     (< 3 de diferencia media a 920/1000/1080/1170, contra un listón de
     3). Pero las dos obligan a pasar de inset() a clip-path: url(), y
     ahí el borde superior de las letras se rasteriza distinto: la
     aceptación del relevo pasaba de 4.811 a 6.970 sobre un umbral de 8,
     el mismo número en las dos variantes. A cambio, el TBT se movía
     dentro del ruido de la máquina. Revertido: el relevo es el fotograma
     que tiene que ser exacto. Si esto se vuelve a tocar, que sea con la
     medida hecha en el preview, no en dev-server. */
  mover(
    kbtk,
    [
      { clipPath: "inset(98.125% 0 1.875% 0)", offset: 0, easing: EASE_OUT },
      { clipPath: "inset(1.875% 0 1.875% 0)", offset: 1 },
    ],
    tramo(T.kbtkIn, T.digital)
  );

  // DIGITAL aparece de golpe en --g1 y vira a --w1 durante el viaje: el
  // header real lo pinta con currentColor, que es --w1, y el relevo
  // exige que el fotograma anterior y el posterior sean el mismo píxel.
  // Opacidad y color, otra vez separados: una es componible y el otro no.
  mover(digital, [{ opacity: 0, easing: SALTO_YA }, { opacity: 1 }], corte(T.digital));
  mover(
    digital,
    [
      { fill: G1, offset: 0, easing: "linear" },
      { fill: W1, offset: 1 },
    ],
    tramo(T.virajeIn, T.virajeOut)
  );

  // FASE 4 · LA CORTINA — la página no se descubre: la descubre su
  // propia estructura, columna a columna, de izquierda a derecha.
  columnas.forEach((col, i) => {
    const arranca = T.cortina + i * PASO;
    const subida = mover(
      col,
      [
        { transform: "translateY(0)", offset: 0, easing: EASE_MECH },
        { transform: "translateY(-100%)", offset: 1 },
      ],
      tramo(arranca, arranca + RECORRIDO)
    );
    // Arriba y fuera de la pantalla, pero seguía siendo una capa
    // promocionada con su animación rellenando. Cada columna se apaga
    // en cuanto llega.
    apagarAlTerminar(col, subida);
  });

  // EL RELEVO — el logotipo real del header espera en opacity 0 (CSS en
  // línea del <head>) y se enciende en el mismo fotograma en que el
  // vector se apaga: los dos son cortes de 1 ms sobre la misma línea de
  // tiempo, en el mismo instante. Ningún rectángulo tapando nada.
  const animLogo = mover(logoReal, [{ opacity: 0, easing: SALTO_YA }, { opacity: 1 }], corte(T.relevo));

  // Maestra: no pinta nada, solo marca el final de los 1700 ms.
  const maestra = mover(raiz, [{ opacity: 1 }, { opacity: 1 }]);

  // La red de seguridad del <head> arranca con un plazo fijo desde el
  // documento por si este script nunca llega a ejecutarse. Si se llega
  // hasta aquí, se reprograma con margen sobre la duración real de ESTA
  // apertura (1700 ms + 1500 de colchón), para que una carga lenta de
  // main.js no le robe presupuesto a la animación misma. No existe bajo
  // ?apertura=freeze (el <head> no lo define ahí), de ahí la guarda.
  if (typeof window.__aperturaArranco === "function") {
    window.__aperturaArranco(TOTAL + 1500);
  }

  const congelada = /[?&]apertura=freeze/.test(location.search);
  let ultimoSeek = 0;

  /* ---------- EL VIAJE A LA BARRA · se mide TARDE, y a propósito ------
     El destino no se puede medir aquí arriba. La caja del logotipo del
     header no es estable en el primer fotograma: el reset de main.css
     (§1, `img, svg { max-width: 100% }`) deja que las acciones de la
     barra —"ES / EN" y el CTA, ambos en Fragment Mono— le coman ancho,
     así que cuando la fuente aterriza el logotipo REAL cambia de
     tamaño. Medido a 390: 134.36 px de ancho antes del swap y 118.81
     después. main.js va en defer, así que corre a un lado o al otro de
     ese salto según cómo venga la carga: medir al arrancar convertía el
     aterrizaje en una lotería, y el test del relevo lo cazó (76.0 de
     diferencia media en móvil, contra un umbral de 8).
     Se mide cuando la maquetación ya está quieta y se engancha el
     resultado a la MISMA línea de tiempo vía startTime, así que no hay
     deriva de fase por crearlo tarde.

     Y se mide sobre la caja de CONTENIDO, no sobre la del elemento: con
     preserveAspectRatio por defecto (xMidYMid meet) un elemento de
     118.81x32 dibuja el lockup a escala 0.0946 y lo centra en vertical,
     dejando 1.9px de aire arriba y abajo. De ahí sale también por qué
     el boceto anotaba una escala móvil más pequeña (0.0839): la sacó de
     una captura, donde el logotipo ya estaba encogido. */
  lockup.style.transform = situar(cxHero, cyHero, sHero); // base sin animación

  let viaje = null;
  function crearViaje() {
    const r = logoReal.querySelector("svg").getBoundingClientRect();
    const s = Math.min(r.width / VB_W, r.height / VB_H);
    const cx = r.left + (r.width - VB_W * s) / 2 + SYM_X * s;
    const cy = r.top + (r.height - VB_H * s) / 2 + SYM_Y * s;

    if (viaje) {
      anim.splice(anim.indexOf(viaje), 1);
      viaje.cancel();
    }
    // Acotado al viaje de verdad: antes de los 1200 el lockup está
    // quieto en el hero y después del relevo ya no se ve. El relleno
    // hacia atrás y hacia delante da esos mismos dos valores.
    viaje = mover(lockup, [
      { transform: situar(cxHero, cyHero, sHero), easing: EASE_OUT },
      { transform: situar(cx, cy, s) },
    ], tramo(T.cortina, T.relevo));
    if (congelada) {
      viaje.pause();
      viaje.currentTime = ultimoSeek;
    } else {
      // misma fase que el resto, sin deriva por haberlo creado tarde
      viaje.startTime = maestra.startTime === null ? document.timeline.currentTime : maestra.startTime;
    }
  }
  // document.fonts.ready es el único evento que mueve esta caja, y cae
  // muy por delante de los 900 ms en que el lockup se hace visible.
  document.fonts.ready.then(crearViaje, crearViaje);

  /* ---------- Gancho de verificación ----------
     Solo con ?apertura=freeze. Congela la línea de tiempo en t=0 y deja
     buscar un instante exacto, que es lo que permite capturar los
     fotogramas de 0/300/600/900/1100/1400/1700 ms sin depender del
     reloj. En producción no se activa nunca. */
  if (congelada) {
    anim.forEach((a) => a.pause());
    // Un solo origen para todas: currentTime ya incluye el delay del
    // efecto —el retardo vive DENTRO del modelo de tiempo del efecto, no
    // fuera—, así que las acotadas con tramo() se buscan igual que las
    // que duran los 1700 ms. Fuera de su ventana, fill "both" devuelve
    // exactamente el valor de relleno, que es el que toca.
    window.__aperturaSeek = (ms) => {
      ultimoSeek = ms;
      anim.forEach((a) => { a.pause(); a.currentTime = ms; });
    };
    window.__aperturaSeek(0);
    return;
  }

  maestra.finished.then(() => {
    cerrar();
    animLogo.cancel(); // la clase ya lo deja en opacity 1: sin parpadeo
  }, () => {});
})();

/* ============================================================
   KBTK Digital — main.js
   Fase 4.5: correcciones de arquitectura y rendimiento.
   A01 — El índice de S2 ya no lo crea este script: lo genera
   scripts/generar-indice.mjs en el build, desde data/obras.js,
   dentro de <!-- OBRAS:INICIO/FIN --> en index.html. Este script
   SOLO se engancha a esas filas; si no las encuentra, avisa y sale.
   A02 — GSAP + ScrollTrigger + CustomEase + Lenis ya no se cargan
   con <script> estático: solo se importan (import() dinámico) al
   entrar en la rama de escritorio. Móvil no descarga ni un byte.
   A03 — Arranca en requestAnimationFrame, no en la misma tarea que la
   apertura. Las dos IIFEs son parte del mismo script defer y se
   ejecutaban una detrás de otra sin ceder el hilo: el trabajo de esta
   sección competía por el mismo fotograma que el arranque del barrido
   de la apertura (0-500ms) y en una carga fría (sin caché de bytecode
   de V8, sin nada tibio) se lo comía entero — la cortina y el KBTK se
   veían, el barrido de colores no. Un solo rAF garantiza que el primer
   fotograma de la apertura se pinta antes de que esto empiece.
   ============================================================ */

function iniciarS2() {
  "use strict";

  const MQ_DESKTOP = "(min-width: 1024px) and (pointer: fine)";
  // idéntica, carácter a carácter, a la usada en css/main.css (§8, S2 móvil)
  const MQ_MOBILE = "not all and (min-width: 1024px) and (pointer: fine)";

  const obras = [...OBRAS].sort((a, b) => a.orden - b.orden);
  const activa = obras.find((o) => o.orden === 1) || obras[0];
  // E03: única fuente de verdad de "qué obra está activa ahora mismo".
  // Declarada aquí (no más abajo) para que pintarContador() pueda leerla
  // desde su primera llamada — antes vivía a mitad de fichero y
  // pintarContador seguía leyendo `activa`, la obra del PRIMER
  // fotograma, congelada para siempre: cada cruce de breakpoint volvía
  // a escribir "01" encima del estado real.
  let obraActiva = activa;

  const pad = (n) => String(n).padStart(2, "0");

  function reducidoAhora() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  // lee una duración del contrato (tokens.css) y la devuelve en segundos
  // para GSAP — bajo prefers-reduced-motion, tokens.css ya las deja en
  // 0ms, así que leerlas aquí basta para que cualquier tween se complete
  // al instante sin tener que duplicar esa lógica en JS.
  function segundos(nombreVar, porDefecto) {
    const crudo = getComputedStyle(document.documentElement)
      .getPropertyValue(nombreVar)
      .trim();
    const m = crudo.match(/^([\d.]+)(ms|s)$/);
    if (!m) return porDefecto;
    return m[2] === "ms" ? parseFloat(m[1]) / 1000 : parseFloat(m[1]);
  }

  /* ---------- A01: enganche, no creación ---------- */
  const filas = document.querySelectorAll(".s2__filas .s2__fila");
  if (!filas.length) {
    // esperado en cualquier página que no sea el índice (p. ej. una
    // página de obra, fase 5): ahí .s2__filas no existe por diseño.
    if (!document.body.classList.contains("pagina-obra")) {
      console.warn(
        "[KBTK] .s2__filas está vacío — falta ejecutar `npm run build:indice` " +
          "(scripts/generar-indice.mjs) antes de servir la página."
      );
    }
    return;
  }

  const esDesktopAlCargar = window.matchMedia(MQ_DESKTOP).matches;

  // B04: por debajo de 1024px no hay visor, así que "CARGADO EN VISOR"
  // (copy-es.json s2.kicker_derecha) miente. La mitad derecha se
  // sustituye por s2.kicker_derecha_movil ("EN ESTE PANEL").
  function pintarContador() {
    const contador = document.getElementById("s2-contador");
    if (contador) {
      contador.textContent = window.matchMedia(MQ_MOBILE).matches
        ? `${pad(obras.length)} REGISTROS · ${pad(obras.length)} EN ESTE PANEL`
        : `${pad(obras.length)} REGISTROS · ${pad(obraActiva.orden)} CARGADO EN VISOR`;
    }
    const activo = document.getElementById("s2-activo");
    if (activo) {
      activo.textContent = `ESTADO ACTIVO · ${pad(obraActiva.orden)} / ${pad(obras.length)}`;
    }
  }

  // El visor (desktop) sigue siendo JS-only: exige interactividad
  // (conmutación, vídeo) que no tiene sentido sin JS, así que no forma
  // parte del índice estático de A01.
  function pintarVisor() {
    const frame = document.querySelector(".s2__visor-frame");
    if (!frame) return;

    for (const obra of obras) {
      const esActiva = obra === activa;
      const picture = document.createElement("picture");
      const source = document.createElement("source");
      source.type = "image/webp";
      source.srcset = `${obra.poster700} 700w, ${obra.poster1400} 1400w`;
      source.sizes = "620px";
      const img = document.createElement("img");
      img.className = esActiva ? "s2__poster is-active" : "s2__poster";
      img.dataset.slug = obra.slug;
      img.src = obra.poster;
      img.alt = `Captura de la web de ${obra.nombre}`;
      img.width = 1280;
      img.height = 800;
      img.loading = esActiva && esDesktopAlCargar ? "eager" : "lazy";
      picture.append(source, img);
      frame.appendChild(picture);
    }

    const etiqueta = document.querySelector(".s2__visor-etiqueta");
    if (etiqueta) {
      etiqueta.textContent = `VISOR · REG ${pad(activa.orden)} · ${activa.nombre}`;
    }

    const estado = document.querySelector('.s2__ficha [data-campo="estado"]');
    if (estado) estado.textContent = activa.estado;

    const sector = document.querySelector('.s2__ficha [data-campo="sector"]');
    if (sector) sector.textContent = activa.sector;

    const cta = document.querySelector(".s2__cta");
    if (cta) cta.href = `/obras/${activa.slug}/`;
  }

  // único <video> del documento — main.js solo le cambia el src en cada
  // conmutación, nunca crea uno nuevo. Antes vivía dentro de pintarVisor()
  // y se creaba SIEMPRE, también en móvil: su atributo `poster` se
  // descarga en cuanto el elemento entra al DOM, sin importar que
  // .s2__visor esté en display:none (a diferencia de <img loading=lazy>,
  // el poster de <video> no tiene forma nativa de diferirse) — doble
  // descarga del póster de la fila activa (jpg del vídeo + webp de la
  // fila) justo en la ventana del LCP. Ahora solo se monta si hace falta:
  // al cargar ya en escritorio, o al cruzar a escritorio más tarde
  // (idempotente via el querySelector de guarda).
  function montarVideoVisor() {
    const frame = document.querySelector(".s2__visor-frame");
    if (!frame || frame.querySelector(".s2__video")) return;
    const video = document.createElement("video");
    video.className = "s2__video";
    video.muted = true;
    video.setAttribute("muted", "");
    video.loop = true;
    video.playsInline = true;
    video.preload = "none";
    video.poster = activa.poster;
    frame.appendChild(video);
  }

  pintarContador();
  pintarVisor();

  /* ------------------------------------------------------------
     A partir de aquí: movimiento (fase 4), reorganizado por A02.
     ------------------------------------------------------------ */

  function actualizarAccentRoot(obra) {
    const root = document.documentElement.style;
    root.setProperty("--obra-accent", `var(${obra.accentVar})`);
    root.setProperty("--obra-ink", `var(${obra.inkVar})`);
  }

  function actualizarFilaActiva(obra) {
    document.querySelectorAll(".s2__fila").forEach((li) => {
      const esta = li.dataset.slug === obra.slug;
      li.classList.toggle("is-active", esta);
      if (esta) {
        li.style.setProperty("--accent", `var(${obra.accentVar})`);
        li.style.setProperty("--accent-ink", `var(${obra.inkVar})`);
      }
    });
  }

  /* ---------- Móvil/tablet: IntersectionObserver nativo — A02 ----------
     Cero GSAP, cero Lenis, cero vídeo: solo lectura de scroll nativa. */
  function activarObservadorMovil() {
    const posters = document.querySelectorAll(".s2__fila-poster");
    if (!posters.length) return () => {};

    const estados = new Map();

    // con filas cortas y viewports altos, más de una ficha puede llegar
    // a >= 60% a la vez — el desempate es la más cercana al centro del
    // viewport, no la última observada.
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const fila = entry.target.closest(".s2__fila");
          if (!fila) return;
          const centro = Math.abs(
            (entry.boundingClientRect.top + entry.boundingClientRect.bottom) / 2 -
              window.innerHeight / 2
          );
          estados.set(fila.dataset.slug, { ratio: entry.intersectionRatio, centro });
        });

        let mejorSlug = null;
        let mejorCentro = Infinity;
        estados.forEach((datos, slug) => {
          if (datos.ratio >= 0.6 && datos.centro < mejorCentro) {
            mejorCentro = datos.centro;
            mejorSlug = slug;
          }
        });

        if (mejorSlug && mejorSlug !== obraActiva.slug) {
          const obra = obras.find((o) => o.slug === mejorSlug);
          if (obra) {
            actualizarFilaActiva(obra);
            actualizarAccentRoot(obra);
            obraActiva = obra;
            // E03: #s2-activo (pie del listado) es visible también en
            // móvil — sin esto, obraActiva avanza con el scroll pero el
            // pie se queda con el número con el que se entró a móvil.
            pintarContador();
          }
        }

        // Ancla del halo. En móvil no hay visor, así que el ancla es la
        // ficha activa y la escribe este mismo observador. Solo hace
        // falta reescribirla cuando CAMBIA la ficha: el desplazamiento
        // va en coordenadas de documento, así que el scroll no lo
        // invalida. Es una escritura por ficha, no por fotograma.
        anclarHaloMovil();
      },
      { threshold: [0, 0.2, 0.4, 0.6, 0.8, 1] }
    );

    // El centro se expresa en px de DOCUMENTO, no en % de pantalla: la
    // caja del emisor es el documento entero (position:absolute contra
    // body), así que este número es constante mientras la ficha activa
    // no cambie y el scroll no lo mueve. Un % aquí sería un % del
    // documento, que no significa nada.
    // Misma función que en escritorio: por offsetParent, para que la
    // posición de reposo no la contamine ningún desplazamiento de
    // pintado (transform de entrada, sticky).
    function anclarHaloMovil() {
      const fila = document.querySelector(`.s2__fila[data-slug="${obraActiva.slug}"]`);
      const poster = fila && fila.querySelector(".s2__fila-poster");
      if (!poster) return;
      const alto = poster.getBoundingClientRect().height;
      const centro = desplazamientoEnDocumento(poster) + alto / 2;
      document.documentElement.style.setProperty("--halo-y", `${centro.toFixed(2)}px`);
    }

    posters.forEach((el) => io.observe(el));
    anclarHaloMovil();
    // Reanclar tras un cambio de maquetación (resize, swap de fuente):
    // el desplazamiento en el documento sí cambia ahí, y solo ahí.
    const ro = new ResizeObserver(anclarHaloMovil);
    ro.observe(document.body);
    return () => {
      io.disconnect();
      ro.disconnect();
      // al cruzar a escritorio manda el ancla del bisel: hay que soltar
      // el valor inline o quedaría el último desplazamiento móvil.
      document.documentElement.style.removeProperty("--halo-y");
    };
  }

  /* ---------- Desktop: import() dinámico + gsap.matchMedia — A02 ----------
     El import() vive DENTRO de la rama de escritorio: solo se ejecuta
     al entrar en (min-width: 1024px) and (pointer: fine), y una única
     vez (movimientoCargado evita reimportar en cruces posteriores). */
  let movimientoCargado = false;

  function iniciarMovimientoDesktop() {
    if (movimientoCargado) return;
    movimientoCargado = true;

    (async () => {
      // ESM real (ver scripts/copy-vendor.mjs) — import() no puede
      // cargar el dist/*.min.js de GSAP: es UMD para <script> clásico
      // y su wrapper revienta en modo estricto. Aquí se capturan los
      // exports del módulo directamente, no globales de window.
      const [{ gsap }, { default: CustomEase }, { default: ScrollTrigger }, { default: Lenis }] =
        await Promise.all([
          import("/vendor/gsap/esm/index.js"),
          import("/vendor/gsap/esm/CustomEase.js"),
          import("/vendor/gsap/esm/ScrollTrigger.js"),
          import("/vendor/lenis/lenis.mjs"),
        ]);

      gsap.registerPlugin(ScrollTrigger, CustomEase);
      // mismos valores que --ease-mech / --ease-out en tokens.css —
      // GSAP no interpreta cubic-bezier() de CSS, así que se registran
      // aquí una vez con el mismo número, no con otro.
      CustomEase.create("ease-mech", "0.2, 0.7, 0.2, 1");
      CustomEase.create("ease-out-kbtk", "0.16, 1, 0.3, 1");

      const mm = gsap.matchMedia();
      let switchTl = null;
      let videoListoHandler = null;
      let playDebounceTimer = null;
      // E03: falso en el primer montaje de MQ_DESKTOP (la carga inicial,
      // donde obraActiva === activa y todo ya está pintado). true en
      // cualquier remontaje posterior — es decir, cada vez que se vuelve
      // a desktop tras haber pasado por móvil, donde el IntersectionObserver
      // pudo haber cambiado obraActiva sin que el visor/ficha/cabecera de
      // escritorio, que solo se repintan desde conmutar(), se enteraran.
      let entradaPrevia = false;

      function cancelarPlayDebounce() {
        if (playDebounceTimer) {
          clearTimeout(playDebounceTimer);
          playDebounceTimer = null;
        }
      }

      function actualizarFicha(obra) {
        const etiqueta = document.querySelector(".s2__visor-etiqueta");
        if (etiqueta) etiqueta.textContent = `VISOR · REG ${pad(obra.orden)} · ${obra.nombre}`;

        const estado = document.querySelector('.s2__ficha [data-campo="estado"]');
        if (estado) estado.textContent = obra.estado;

        const sector = document.querySelector('.s2__ficha [data-campo="sector"]');
        if (sector) sector.textContent = obra.sector;

        const cta = document.querySelector(".s2__cta");
        if (cta) cta.href = `/obras/${obra.slug}/`;

        const contador = document.getElementById("s2-contador");
        if (contador) contador.textContent = `${pad(obras.length)} REGISTROS · ${pad(obra.orden)} CARGADO EN VISOR`;

        const activo = document.getElementById("s2-activo");
        if (activo) activo.textContent = `ESTADO ACTIVO · ${pad(obra.orden)} / ${pad(obras.length)}`;
      }

      function actualizarPosters(obra) {
        document.querySelectorAll(".s2__poster").forEach((img) => {
          img.classList.toggle("is-active", img.dataset.slug === obra.slug);
        });
      }

      // fase con vídeo: usada solo en desktop y solo sin movimiento reducido.
      // E02: el vídeo entrante NO reproduce al instante. Se carga (así el
      // póster, que ES su primer fotograma, releva sin salto en cuanto
      // haya datos) y play() queda a la espera de --dur-visor-debounce:
      // si el ratón cruza varias filas de golpe, cada conmutación reinicia
      // la espera y solo la última fila en la que se detiene dispara vídeo.
      function actualizarVisorConVideo(obra) {
        actualizarPosters(obra);

        const video = document.querySelector(".s2__video");
        if (!video) return;

        cancelarPlayDebounce();
        if (videoListoHandler) video.removeEventListener("loadeddata", videoListoHandler);
        video.classList.remove("is-active");
        video.pause();
        video.querySelectorAll("source").forEach((s) => s.remove());
        video.poster = obra.poster;

        videoListoHandler = () => {
          video.classList.add("is-active");
        };
        video.addEventListener("loadeddata", videoListoHandler, { once: true });

        const srcWebm = document.createElement("source");
        srcWebm.src = obra.webm;
        srcWebm.type = "video/webm";
        const srcMp4 = document.createElement("source");
        srcMp4.src = obra.mp4;
        srcMp4.type = "video/mp4";
        video.append(srcWebm, srcMp4);
        video.load();

        playDebounceTimer = setTimeout(() => {
          playDebounceTimer = null;
          // currentTime=0 explícito: load() ya resetea la posición, pero
          // es el propio contrato (E02) el que exige el reset delante de
          // play(), no solo confiar en el efecto colateral de load().
          video.currentTime = 0;
          video.play().catch(() => {}); // autoplay silenciado; el navegador puede rechazarlo igualmente
        }, segundos("--dur-visor-debounce", 0.6) * 1000);
      }

      // fase sin vídeo: reduced-motion en desktop. Póster fijo, cero play().
      function actualizarVisorSinVideo(obra) {
        actualizarPosters(obra);
        const video = document.querySelector(".s2__video");
        if (!video) return;
        cancelarPlayDebounce();
        if (videoListoHandler) video.removeEventListener("loadeddata", videoListoHandler);
        video.classList.remove("is-active");
        video.pause();
        video.querySelectorAll("source").forEach((s) => s.remove());
        video.removeAttribute("src");
        video.poster = obra.poster;
      }

      function activarObra(obra) {
        actualizarFilaActiva(obra);
        actualizarFicha(obra);
        actualizarAccentRoot(obra);
        obraActiva = obra;
      }

      /* ---------- Conmutación del visor por hover/foco ---------- */
      mm.add(MQ_DESKTOP, () => {
        const frame = document.querySelector(".s2__visor-frame");
        if (!frame) return;

        // E03: resincronización instantánea al volver a desktop — ver
        // el comentario de `entradaPrevia` más arriba. Sin animación de
        // conmutación (no es un cambio de obra a ojos del usuario, es
        // el mismo estado que traía de móvil apareciendo por fin en un
        // visor que hasta ahora estaba en display:none).
        if (entradaPrevia) {
          actualizarFilaActiva(obraActiva);
          actualizarFicha(obraActiva);
          actualizarAccentRoot(obraActiva);
          if (reducidoAhora()) {
            actualizarVisorSinVideo(obraActiva);
          } else {
            actualizarVisorConVideo(obraActiva);
          }
        }
        entradaPrevia = true;

        const overlay = document.createElement("div");
        overlay.className = "s2__visor-overlay";
        overlay.setAttribute("aria-hidden", "true");
        const scan = document.createElement("span");
        scan.className = "s2__visor-overlay-scan";
        const label = document.createElement("p");
        label.className = "s2__visor-overlay-label t-data";
        label.innerHTML = "SIN SEÑAL <span>– – – –</span>";
        overlay.append(scan, label);
        frame.appendChild(overlay);

        function conmutar(obra) {
          if (obra.slug === obraActiva.slug) return;

          if (reducidoAhora()) {
            if (switchTl) { switchTl.kill(); switchTl = null; }
            gsap.set(overlay, { opacity: 0 });
            actualizarVisorSinVideo(obra);
            activarObra(obra);
            return;
          }

          if (switchTl) switchTl.kill();

          const durOut = segundos("--dur-swap-out", 0.12);
          const durGap = segundos("--dur-swap-gap", 0.04);
          const durIn = segundos("--dur-swap-in", 0.22);

          switchTl = gsap.timeline({
            defaults: { overwrite: "auto" },
            onComplete() { switchTl = null; },
          });

          switchTl
            .set(scan, { opacity: 1, backgroundPositionY: "-30%" })
            .to(overlay, { opacity: 1, duration: durOut, ease: "power4.in" }, 0)
            .to(scan, { backgroundPositionY: "130%", duration: durOut, ease: "none" }, 0)
            .call(() => {
              actualizarVisorConVideo(obra);
              activarObra(obra);
            })
            .set(label, { opacity: 1 })
            .to({}, { duration: durGap })
            .set(label, { opacity: 0 })
            .to(overlay, { opacity: 0, duration: durIn, ease: "ease-mech" });
        }

        const desligar = [];
        document.querySelectorAll(".s2__filas .s2__fila").forEach((li) => {
          const a = li.querySelector("a");
          if (!a) return;
          const obra = obras.find((o) => o.slug === li.dataset.slug);
          if (!obra) return;
          const onActivar = () => conmutar(obra);
          a.addEventListener("mouseenter", onActivar);
          a.addEventListener("focus", onActivar);
          desligar.push(() => {
            a.removeEventListener("mouseenter", onActivar);
            a.removeEventListener("focus", onActivar);
          });
        });

        let lenis = null;
        let lenisTick = null;
        if (!reducidoAhora()) {
          lenis = new Lenis({ duration: 1.1 });
          lenis.on("scroll", ScrollTrigger.update);
          lenisTick = (time) => lenis.raf(time * 1000);
          gsap.ticker.add(lenisTick);
          gsap.ticker.lagSmoothing(0);
        }

        return () => {
          desligar.forEach((fn) => fn());
          if (switchTl) { switchTl.kill(); switchTl = null; }
          cancelarPlayDebounce();
          overlay.remove();

          // cero vídeo fuera de desktop: para y limpia al salir del contexto
          const video = document.querySelector(".s2__video");
          if (video) {
            if (videoListoHandler) video.removeEventListener("loadeddata", videoListoHandler);
            video.pause();
            video.classList.remove("is-active");
            video.querySelectorAll("source").forEach((s) => s.remove());
            video.removeAttribute("src");
          }

          if (lenis) {
            lenis.off("scroll", ScrollTrigger.update);
            if (lenisTick) gsap.ticker.remove(lenisTick);
            lenis.destroy();
          }
        };
      });

      /* ---------- Filas del índice: reveal por scroll ----------
         Solo desktop: el estado oculto inicial ([data-mask] en CSS)
         también está escoped a MQ_DESKTOP — en móvil las filas son
         visibles desde el primer paint, sin GSAP que las revele. */
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tween = gsap.to(filas, {
          opacity: 1,
          "--reveal-y": "0px",
          duration: segundos("--dur-reveal-row", 0.7),
          stagger: segundos("--stagger-row-reveal", 0.07),
          ease: "ease-out-kbtk",
          scrollTrigger: {
            trigger: ".s2__filas",
            start: "top 80%",
            once: true,
          },
        });

        // E04/F04: filas de la tabla de entregables — mismo reveal,
        // mismos valores de contrato (y 28px vía [data-mask], 700ms,
        // escalón de 70ms, once), disparo propio al entrar la tabla
        // en viewport. Lee --dur-reveal-row/--stagger-row-reveal, no
        // --dur-reveal/--stagger-row (esas siguen siendo del arranque).
        const filasTabla = document.querySelectorAll(".s4__fila");
        const tweenTabla = filasTabla.length
          ? gsap.to(filasTabla, {
              opacity: 1,
              "--reveal-y": "0px",
              duration: segundos("--dur-reveal-row", 0.7),
              stagger: segundos("--stagger-row-reveal", 0.07),
              ease: "ease-out-kbtk",
              scrollTrigger: {
                trigger: ".s4__tabla",
                start: "top 80%",
                once: true,
              },
            })
          : null;

        return () => {
          if (tween.scrollTrigger) tween.scrollTrigger.kill();
          tween.kill();
          if (tweenTabla) {
            if (tweenTabla.scrollTrigger) tweenTabla.scrollTrigger.kill();
            tweenTabla.kill();
          }
        };
      });

      /* ---------- Arranque del panel, 600ms, cada carga (F02) ----------
         Un único arranque: las reglas de 1px (--boot-line) se dibujan
         de izquierda a derecha y las cifras de la barra cuentan. El
         emisor ya NO entra aquí: su encendido vive en CSS, sobre el
         propio emisor (main.css §5b), para que las tres superficies
         arranquen igual — una página de obra no ejecuta esto. Ocurre en
         cada carga de página, no solo la primera de la sesión: es lo
         que verá un cliente cuando se le enseñe la página en el móvil,
         y ahí no hay sessionStorage que valga. El H1 no entra aquí: se
         pinta en el primer fotograma, sin guard, sin tween.
         .status-bar__meta ya está display:none por debajo de 1024px
         (main.css), así que esto es, de facto, desktop-only — coherente
         con que gsap solo exista aquí. El equivalente móvil (sin GSAP)
         vive en arranquePanelMovil(), más abajo. El estado "apagado"
         (CSS, guard .js + MQ_DESKTOP) ya deja rótulo/halo en su valor
         final bajo prefers-reduced-motion, así que aquí basta con no
         animar. */
      (function arranquePanel() {
        if (reducidoAhora()) return;

        const tl = gsap.timeline();

        const lineas = document.querySelectorAll(".s2__listado-head, .s2__listado-foot");
        if (lineas.length) {
          tl.to(lineas, {
            "--boot-line": "100%",
            duration: segundos("--dur-reveal", 0.5),
            stagger: segundos("--stagger-row", 0.04),
            ease: "ease-out-kbtk",
          }, 0);
        }

        // El halo ya NO se anima aquí. Su encendido vive en CSS, sobre
        // el propio emisor (main.css §5b), con la misma duración
        // (--dur-reveal) y el mismo retardo (100ms) que tenía este
        // tween. Se movió para que las tres superficies arranquen
        // igual: en una página de obra no corre arranquePanel(), así
        // que con el tween aquí el emisor se quedaba a --glow-op 0.

        const meta = document.querySelector(".status-bar__meta");
        if (meta) {
          const texto = meta.textContent;
          const finales = texto.match(/\d+/g);
          if (finales) {
            meta.innerHTML = texto.replace(/\d+/g, (m) => `<span class="js-num">${"0".repeat(m.length)}</span>`);
            const spans = meta.querySelectorAll(".js-num");
            const dur = segundos("--dur-accent", 0.4);

            spans.forEach((span, i) => {
              const final = parseInt(finales[i], 10);
              const digitos = finales[i].length;
              const obj = { val: 0 };
              tl.to(obj, {
                val: final,
                duration: dur,
                ease: "none",
                onUpdate() {
                  span.textContent = String(Math.round(obj.val)).padStart(digitos, "0");
                },
              }, 0);
            });
          }
        }
      })();
    })();
  }

  /* ---------- Ancla del emisor en escritorio (G01/G02) ----------
     El centro de la luz es el centro del bisel del visor, en
     coordenadas de DOCUMENTO. El visor no se pega (holgura cero con 4
     obras: lista y visor miden lo mismo, ya medido y aceptado), así que
     se desplaza con el documento — y por eso en coordenadas de
     documento su centro es una CONSTANTE y basta escribirla una vez.
     Ni un listener de scroll toca --halo-y ni --halo-x: lo único que
     invalida el número es un cambio de maquetación, y de eso avisa el
     ResizeObserver. La escritura se coalesce en un rAF para no leer
     geometría en cada evento de un arrastre de resize; no es un bucle
     por fotograma: se agenda un único fotograma por ráfaga. */
  let anclaPedida = false;

  /* Desplazamiento en el documento por la cadena de offsetParent, y NO
     por getBoundingClientRect() + scrollY. Los dos coinciden casi
     siempre, pero difieren justo donde importa: el rect incluye el
     desplazamiento de PINTADO (sticky, transform) y offsetTop no.
     Medido hoy: .s2__visor sí se pega —72.5px de recorrido antes de
     soltarse contra el final de su área de rejilla, no los 0px que
     dábamos por medidos—, así que rect.top + scrollY del bisel salta de
     1017.8 a 1090.3 a mitad de scroll. Con offsetTop se queda en 1018.8
     a cualquier scroll: eso es una constante de documento, que es lo
     que este emisor necesita. El sticky no se toca aquí; simplemente la
     arquitectura no depende de él. */
  function desplazamientoEnDocumento(el) {
    let y = 0;
    for (let n = el; n; n = n.offsetParent) y += n.offsetTop;
    return y;
  }

  function anclarHaloEscritorio() {
    const bisel = document.querySelector(".s2__visor-bisel");
    if (!bisel) return;
    const alto = bisel.getBoundingClientRect().height;
    // en móvil .s2__visor está en display:none -> altura 0.
    // Ahí manda el IntersectionObserver, no esto.
    if (!alto) return;
    const y = desplazamientoEnDocumento(bisel) + alto / 2;
    document.documentElement.style.setProperty("--halo-y", `${y.toFixed(2)}px`);
  }

  function pedirAnclaEscritorio() {
    if (anclaPedida) return;
    anclaPedida = true;
    requestAnimationFrame(() => {
      anclaPedida = false;
      if (mqDesktop.matches) anclarHaloEscritorio();
    });
  }

  /* ---------- Orquestación reactiva: cruces de 1024px en vivo ---------- */
  const mqDesktop = window.matchMedia(MQ_DESKTOP);
  let desligarMovil = null;

  function evaluarBreakpoint() {
    pintarContador(); // re-evalúa REGISTROS/EN ESTE PANEL vs CARGADO EN VISOR
    if (mqDesktop.matches) {
      if (desligarMovil) {
        desligarMovil();
        desligarMovil = null;
      }
      montarVideoVisor(); // no-op si ya existe
      iniciarMovimientoDesktop(); // no-op si ya se cargó una vez
      anclarHaloEscritorio(); // síncrono: antes de que arranque la rampa
    } else if (!desligarMovil) {
      desligarMovil = activarObservadorMovil();
    }
  }

  /* ---------- Arranque del panel en móvil, sin GSAP (F02) ----------
     Móvil no carga GSAP nunca, así que el arranque ahí no puede
     reusar arranquePanel() de arriba. Mismo lenguaje visual (reglas
     dibujándose vía --boot-line), interpolado por transición CSS
     nativa sobre las custom properties registradas en tokens.css, no
     por un tween de GSAP. Un solo flip de clase basta: main.css (guard
     móvil) define el estado "apagado" bajo .js y el estado final bajo
     .is-booted. El emisor no participa: se enciende solo, en CSS. */
  function arranquePanelMovil() {
    if (reducidoAhora() || !window.matchMedia(MQ_MOBILE).matches) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.documentElement.classList.add("is-booted");
      });
    });
  }

  evaluarBreakpoint();
  mqDesktop.addEventListener("change", evaluarBreakpoint);
  // Un solo observador para las tres cosas que sí mueven el ancla en el
  // documento: resize, swap de fuente y reflujo por carga de medios.
  // NO hay listener de scroll: en coordenadas de documento el scroll no
  // cambia el número.
  new ResizeObserver(pedirAnclaEscritorio).observe(document.body);
  arranquePanelMovil();
}
requestAnimationFrame(iniciarS2);

/* ============================================================
   Fase 5 — página de obra: visor a tamaño completo.
   Un único <video> en TODO el documento, y solo existe en el DOM
   en escritorio: se crea al entrar en MQ_DESKTOP y se destruye al
   salir, así que por debajo de 1024px nunca se monta (solo el
   <picture> del póster, ya presente en el HTML servido). Nada de
   GSAP aquí — no hay conmutación entre obras, solo play/pause al
   entrar y salir del viewport, así que un IntersectionObserver
   nativo basta y la página de obra no descarga el vendor de GSAP.
   ============================================================ */
(function () {
  "use strict";

  if (!document.body.classList.contains("pagina-obra")) return;

  const MQ_DESKTOP = "(min-width: 1024px) and (pointer: fine)";

  function reducidoAhora() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  const marco = document.querySelector("[data-obra-visor]");
  const posterImg = marco && marco.querySelector(".obra-visor__poster");
  if (!marco || !posterImg) return;

  const webm = marco.dataset.webm;
  const mp4 = marco.dataset.mp4;

  const mqDesktop = window.matchMedia(MQ_DESKTOP);
  let video = null;
  let io = null;
  let onLoadedData = null;

  function montar() {
    if (video) return;

    video = document.createElement("video");
    video.className = "obra-visor__video";
    video.muted = true;
    video.setAttribute("muted", "");
    video.loop = true;
    video.playsInline = true;
    video.preload = "none";
    video.poster = posterImg.currentSrc || posterImg.src;

    onLoadedData = () => video.classList.add("is-active");
    video.addEventListener("loadeddata", onLoadedData, { once: true });

    const srcWebm = document.createElement("source");
    srcWebm.src = webm;
    srcWebm.type = "video/webm";
    const srcMp4 = document.createElement("source");
    srcMp4.src = mp4;
    srcMp4.type = "video/mp4";
    video.append(srcWebm, srcMp4);
    marco.appendChild(video);

    io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (!video.currentSrc) video.load();
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.4 }
    );
    io.observe(marco);
  }

  function desmontar() {
    if (io) {
      io.disconnect();
      io = null;
    }
    if (video) {
      if (onLoadedData) video.removeEventListener("loadeddata", onLoadedData);
      video.pause();
      video.remove();
      video = null;
    }
  }

  function evaluar() {
    if (mqDesktop.matches && !reducidoAhora()) montar();
    else desmontar();
  }

  evaluar();
  mqDesktop.addEventListener("change", evaluar);
})();

/* ============================================================
   F04 — reveal línea a línea de [data-line-reveal] y reveal de
   [data-mask] en páginas de obra. Corre en TODAS las páginas:
   el primer IIFE de este fichero sale temprano sin .s2__filas
   (obra), el segundo solo existe con .pagina-obra (no el
   índice) — ninguno de los dos sirve de base para esto. Sin
   GSAP: IntersectionObserver + transición CSS nativa sobre las
   custom properties de main.css, igual que el arranque móvil
   de F02. Desktop-only, como el resto de reveals del sitio.
   ============================================================ */
(function () {
  "use strict";

  const MQ_DESKTOP = "(min-width: 1024px) and (pointer: fine)";
  const mqDesktop = window.matchMedia(MQ_DESKTOP);

  function reducidoAhora() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  const titulares = document.querySelectorAll("[data-line-reveal]");
  const bloquesObra = document.querySelectorAll(".pagina-obra [data-mask]");
  if (!titulares.length && !bloquesObra.length) return;

  // Envuelve el texto de un titular en un <span class="t-display__linea">
  // por línea VISUAL — no por frase — midiendo en runtime (el tamaño
  // es clamp(), así que el número de líneas cambia con el ancho; un
  // split en build-time sería incorrecto en muchos anchos). offsetTop
  // agrupa palabras: mismo offsetTop = misma línea.
  function dividirEnLineas(el) {
    const original = el.dataset.textoOriginal || el.textContent.trim();
    el.dataset.textoOriginal = original;

    const palabras = original.split(/\s+/).filter(Boolean);
    el.textContent = "";
    const spans = palabras.map((palabra) => {
      const span = document.createElement("span");
      span.textContent = palabra + " ";
      el.appendChild(span);
      return span;
    });

    const lineas = [];
    let topActual = null;
    spans.forEach((span, i) => {
      const top = span.offsetTop;
      if (topActual === null || top !== topActual) {
        topActual = top;
        lineas.push([]);
      }
      lineas[lineas.length - 1].push(palabras[i]);
    });

    el.textContent = "";
    lineas.forEach((palabrasLinea, i) => {
      const wrapper = document.createElement("span");
      wrapper.className = "t-display__linea";
      wrapper.style.setProperty("--linea-index", i);
      wrapper.textContent = palabrasLinea.join(" ");
      el.appendChild(wrapper);
    });

    // un resize puede re-dividir un titular ya revelado: no lo
    // devuelve a su estado oculto, solo recompone las líneas.
    if (el.dataset.revelado === "1") {
      el.querySelectorAll(".t-display__linea").forEach((l) => l.classList.add("is-revelada"));
    }
  }

  let observerTitulares = null;
  let observerBloques = null;
  let resizeTimer = null;

  function activarTitulares() {
    titulares.forEach(dividirEnLineas);
    if (!observerTitulares) {
      observerTitulares = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.dataset.revelado = "1";
            entry.target
              .querySelectorAll(".t-display__linea")
              .forEach((l) => l.classList.add("is-revelada"));
            observerTitulares.unobserve(entry.target);
          });
        },
        { rootMargin: "0px 0px -20% 0px" }
      );
    }
    titulares.forEach((el) => {
      if (el.dataset.revelado !== "1") observerTitulares.observe(el);
    });
  }

  function desactivarTitulares() {
    if (observerTitulares) observerTitulares.disconnect();
    titulares.forEach((el) => {
      if (el.dataset.textoOriginal) el.textContent = el.dataset.textoOriginal;
    });
  }

  function activarBloques() {
    if (!observerBloques) {
      observerBloques = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-revelada");
            observerBloques.unobserve(entry.target);
          });
        },
        { rootMargin: "0px 0px -20% 0px" }
      );
    }
    bloquesObra.forEach((el) => {
      if (!el.classList.contains("is-revelada")) observerBloques.observe(el);
    });
  }

  function desactivarBloques() {
    if (observerBloques) observerBloques.disconnect();
  }

  function evaluar() {
    const activo = mqDesktop.matches && !reducidoAhora();
    if (activo) {
      if (titulares.length) activarTitulares();
      if (bloquesObra.length) activarBloques();
    } else {
      if (titulares.length) desactivarTitulares();
      if (bloquesObra.length) desactivarBloques();
    }
  }

  evaluar();
  mqDesktop.addEventListener("change", evaluar);
  window.addEventListener("resize", () => {
    if (!titulares.length || !mqDesktop.matches || reducidoAhora()) return;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(activarTitulares, 150);
  });
})();

/* ============================================================
   S3.b — secuencia de arranque de los pasos del método. Mismo
   patrón que el bloque F04 de arriba ([data-mask] en páginas de
   obra): sin GSAP, un único IntersectionObserver que añade
   .is-revelada a .s3__pasos al entrar en viewport; el orden y el
   desfase (180ms entre paso y paso, un desfase corto entre número
   y cuerpo) los resuelve la cascada de transition-delay de
   main.css (§12, S3.b) leyendo --stagger-s3-paso/--stagger-s3-
   cuerpo — cero setTimeout, cero estado de tiempo en JS. Por eso
   este mecanismo no depende de GSAP y puede reutilizarse tal cual
   en una página de obra, que nunca lo carga.
   ============================================================ */
(function () {
  "use strict";

  const MQ_DESKTOP = "(min-width: 1024px) and (pointer: fine)";
  const mqDesktop = window.matchMedia(MQ_DESKTOP);

  function reducidoAhora() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  const pasos = document.querySelector(".s3__pasos");
  if (!pasos) return;

  let observer = null;

  function activar() {
    if (pasos.classList.contains("is-revelada")) return;
    if (!observer) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            pasos.classList.add("is-revelada");
            observer.disconnect();
          });
        },
        { rootMargin: "0px 0px -20% 0px" }
      );
    }
    observer.observe(pasos);
  }

  function desactivar() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  }

  function evaluar() {
    if (mqDesktop.matches && !reducidoAhora()) {
      activar();
    } else {
      desactivar();
    }
  }

  evaluar();
  mqDesktop.addEventListener("change", evaluar);
})();

/* ============================================================
   B — S4: selector de niveles (< 1024px, con JS).
   scripts/generar-niveles.mjs ya deja los tres bloques en el DOM,
   apilados y completos (fallback sin JS). Este bloque SOLO engancha
   los botones 01/02/03 para ocultar dos y animar el tercero — no crea
   nada, y si el contenedor está vacío avisa y sale, mismo patrón que
   el enganche de S2 (A01) más arriba.
   Sin GSAP: bajo 1024px main.js nunca lo carga (A02), así que la
   mecánica de corte/hueco/entrada del conmutador de S2 se reproduce
   aquí con setTimeout + clases sobre la transición CSS de
   .s4__nivel[.is-saliendo/.is-activa] (main.css, §10) — misma curva
   (--ease-mech) y mismas duraciones (--dur-swap-out/gap/in) leídas
   del contrato, no reescritas.
   ============================================================ */
(function () {
  "use strict";

  const contenedor = document.querySelector(".s4__niveles");
  if (!contenedor) return; // página sin S4 (obra, /tarifa): nada que hacer

  const bloques = contenedor.querySelectorAll(".s4__nivel");
  const selector = document.querySelector("[data-nivel-selector]");
  if (!bloques.length || !selector) {
    console.warn(
      "[KBTK] .s4__niveles está vacío o falta el selector — falta ejecutar " +
        "`npm run build:niveles` (scripts/generar-niveles.mjs) antes de servir la página."
    );
    return;
  }

  function reducidoAhora() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function segundos(nombreVar, porDefecto) {
    const crudo = getComputedStyle(document.documentElement)
      .getPropertyValue(nombreVar)
      .trim();
    const m = crudo.match(/^([\d.]+)(ms|s)$/);
    if (!m) return porDefecto;
    return m[2] === "ms" ? parseFloat(m[1]) : parseFloat(m[1]) * 1000;
  }

  let nivelActivo = selector.dataset.nivelActivo || bloques[0].dataset.nivel;
  let cambiando = false;

  function bloquePor(clave) {
    return contenedor.querySelector(`.s4__nivel[data-nivel="${clave}"]`);
  }

  function marcarBotones(clave) {
    selector.querySelectorAll(".s4__selector-btn").forEach((btn) => {
      const activo = btn.dataset.nivelBtn === clave;
      btn.classList.toggle("is-activo", activo);
      btn.setAttribute("aria-selected", activo ? "true" : "false");
    });
  }

  function conmutar(claveNueva) {
    if (cambiando || claveNueva === nivelActivo) return;
    const viejo = bloquePor(nivelActivo);
    const nuevo = bloquePor(claveNueva);
    if (!viejo || !nuevo) return;

    if (reducidoAhora()) {
      viejo.classList.remove("is-activa");
      nuevo.classList.add("is-activa");
      nivelActivo = claveNueva;
      selector.dataset.nivelActivo = claveNueva;
      marcarBotones(claveNueva);
      return;
    }

    cambiando = true;
    const durOut = segundos("--dur-swap-out", 120);
    const durGap = segundos("--dur-swap-gap", 40);

    // corte
    viejo.classList.remove("is-activa");
    viejo.classList.add("is-saliendo");

    setTimeout(() => {
      viejo.classList.remove("is-saliendo");
      // hueco
      setTimeout(() => {
        // entrada
        nuevo.classList.add("is-activa");
        nivelActivo = claveNueva;
        selector.dataset.nivelActivo = claveNueva;
        marcarBotones(claveNueva);
        cambiando = false;
      }, durGap);
    }, durOut);
  }

  selector.addEventListener("click", (ev) => {
    const btn = ev.target.closest(".s4__selector-btn");
    if (!btn) return;
    conmutar(btn.dataset.nivelBtn);
  });
})();
