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
   ============================================================ */

(function () {
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
})();

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
