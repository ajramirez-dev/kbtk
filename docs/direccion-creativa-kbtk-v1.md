# Dirección creativa — Portfolio KBTK Digital · v1

> Carril flagship, flujo v6. Paso 1.2 ejecutado el 07/08/2026.
> Dirección aprobada: **Cuarto de Máquinas**.
> Contrato de estilo: `tokens-v1.css` (fichero aparte, se cruza con diff literal).

---

## Tesis

El fondo oscuro es el estado neutro del sistema. **La casa no tiene color: el croma pertenece siempre a una obra.** KBTK es el acero del cuarto de máquinas; las obras son lo que se enciende. Esto resuelve de raíz el problema que traías —cuatro webs con cuatro dominantes distintos peleándose por un lienzo— y convierte la "gama muy amplia" en una regla en vez de en un caos: la amplitud la aporta el catálogo, no la marca.

La irreverencia no vive en el color. Vive en que **este portfolio enseña números que nadie enseña**: cuántas demos se han construido, cuántas se han vendido, y el estado real de cada obra. Un panel que muestra el estado de algo sin maquillarlo.

**Riesgo asumido, y es deliberado:** el sitio es cromáticamente mudo hasta que el visitante señala algo. Si la ejecución del índice falla, la página vuelve a estar plana. Todo el presupuesto de audacia está puesto ahí. Lo demás se mantiene callado a propósito.

---

## 1 · Estructuras

### 1.1 · HOME

| # | Sección | Fondo | Densidad | Layout | Papel del color |
|---|---|---|---|---|---|
| S0 | Barra de estado | `--k`, hairline inferior | alta, mono | fija, 3 zonas | ninguno salvo LED `--signal` |
| S1 | Declaración | `--k` | media-alta tipográfica | texto a 10 cols, sin imagen | ninguno |
| S2 | **EL ÍNDICE** ★ | `--k` + halo reactivo | máxima interacción | listado 5 cols · visor 6 cols sticky | **toda la mecánica** |
| S3 | Método | `--paper` (**única sección clara**) | baja | hoja de especificaciones, 2 col | ninguno |
| S4 | Qué se entrega | `--k` | media | tabla de especificaciones, no tarjetas | ninguno |
| S5 | Cierre | `--k` | mínima | una línea a tamaño display | `--signal`, una vez |

**Sobre la alternancia claro/oscuro.** La rúbrica del v6 pide alternancia claro/oscuro a lo largo del scroll. Aquí se cumple **una sola vez y a propósito** (S3), porque las cuatro obras son oscuras y un lienzo que parpadea a blanco cada dos secciones las dejaría flotando. La alternancia real de este sitio es **de croma**: neutro (S1) → policromo reactivo (S2) → papel (S3) → neutro (S4) → un destello (S5). Es una desviación consciente de la rúbrica, no un olvido.

**S0 — Barra de estado.** Izquierda: logotipo. Centro (solo ≥1024): lectura en mono `OBRAS 04 · ENTREGADAS 03 · DEMOS CONSTRUIDAS 07`. Derecha: `ES/EN` y `[ CONTACTO ]`.
> ⚠️ **El sello entintado queda fuera.** Dijiste "todo desde cero excepto la tipografía", y eso lo incluye. El logotipo pasa a ser **puramente tipográfico**: `KBTK` en Archivo Expanded 800 caja alta + `DIGITAL` en Fragment Mono a un cuarto del tamaño, alineado a la línea base inferior. Coherente con la dirección —una marca grabada en chapa, no un sello de tinta— pero es un asset que ya tenías. Confírmalo antes del boceto.

**S1 — Declaración.** Sin imagen. La tesis es la frase. Borrador de copy, ES:

> **SU WEB YA EXISTE.**
> La construimos entera antes de que usted decida si la paga.

Debajo, en mono: `07 CONSTRUIDAS · 03 VENDIDAS · 04 EN ESTE PANEL`. El hecho ancla dicho como lectura de instrumento, no como eslogan.
> EN no es traducción: se escribe nativo, es tu muestra de copy. Dirección: la misma economía, cero adjetivos de agencia.

**S2 — El índice.** Ver bloque 3.

**S3 — Método.** Cuatro pasos numerados —y aquí la numeración es legítima porque **es una secuencia real**: se elige el negocio → se construye la página entera → se enseña en persona en el móvil → se decide. Maquetado como datasheet: reglas finas, dos columnas, todo el texto de apoyo en mono. Es la sección que explica por qué el portfolio puede permitirse enseñar demos no vendidas.

**S4 — Qué se entrega.** Diseño y copy en la misma tabla de especificaciones, con lo que SÍ y lo que NO entra. Sin iconos, sin tres tarjetas centradas. Es literalmente una ficha técnica de producto.

**S5 — Cierre.** Una línea a `--fs-display` y el contacto.
> ⚠️ `TODO`: el canal de contacto no está confirmado (¿email, WhatsApp, formulario?). Hasta que lo confirmes va marcado `.ph` y no se maqueta como si existiera.

### 1.2 · PLANTILLA DE PÁGINA DE OBRA

Una sola plantilla para las cuatro y para las diez siguientes. **Ninguna página de obra es a medida.** La página abre ya teñida con el acento de su obra —continuidad con el índice— y va perdiendo croma según baja, hasta cerrar en neutro y devolverte al panel.

Campos, en orden fijo:

| Campo | Tipo | Obligatorio | Nota |
|---|---|---|---|
| `slug` | string | sí | congelado desde el día 1, no se renombra nunca |
| `nombre` | string | sí | |
| `sector` | string | sí | construcción, barbería, peluquería… |
| `estado` | enum | sí | `entregado` \| `publicado-con-permiso` |
| `accent` / `ink` | hex | sí | **medidos** sobre la captura, nunca de memoria |
| `poster` · `webm` · `mp4` | ruta | sí | versionados por nombre (`-v1`) |
| `antes` | ruta | no | ficha de Maps. Si no existe, el bloque no se pinta |
| `url_viva` | url | no | si la web está en producción, se enlaza |
| `problema` | 2–3 frases | sí | qué tenía el negocio antes |
| `decisiones` | lista 3–5 | sí | decisiones de diseño, con su porqué |
| `especificaciones` | pares clave-valor | sí | ver abajo |
| `destacado` | bool | sí | gobierna si lleva vídeo en el visor de la home |

Secciones de la plantilla: **cabecera teñida** (nombre, sector, estado, año) → **el visor a tamaño completo** con el vídeo de scroll → **el "antes"** (captura de Maps, pequeña, tratada como prueba documental, con su etiqueta mono `EVIDENCIA · GOOGLE MAPS · [fecha]`) → **problema** → **decisiones** → **ficha de especificaciones** → **siguiente obra**.

> **Decisión pendiente, y es la más importante del documento:** ¿la ficha de especificaciones publica **métricas reales medidas** (Lighthouse móvil, peso de la página, tiempo de construcción)? Es lo más coherente que puede hacer un portfolio cuya ancla es la transparencia, y es lo que ningún competidor local va a copiar. Pero es un compromiso: si una obra puntúa 78, se publica 78. Si dices que no, la ficha se queda en datos descriptivos (sector, año, alcance) y la transparencia descansa solo en el modelo demo-first. **Necesito tu sí o tu no antes del Paso 2.**

---

## 2 · Coreografía

### 2.1 · Scroll de la home

Curva de densidad: **media → máxima → mínima → media → mínima**.

1. **Entrada.** La barra de estado escribe sus cifras en mono, dígito a dígito, 400 ms. Una vez por sesión (`sessionStorage`). Es lo único que se "enciende" al cargar.
2. **S1.** La declaración ya está compuesta al llegar: sin animación de entrada. La página no pide permiso.
3. **S2.** Al entrar el índice en viewport, **la obra 01 se activa sola**. El visitante llega a una máquina encendida, no a un panel apagado. *(Esto es el arreglo directo del "fondo estático que solo cambia al enseñar una screen".)*
4. **S3.** El corte a papel es duro, sin transición: el sistema se apaga y aparece la documentación impresa.
5. **S5.** Vuelta a negro. El único `--signal` de la página aparece aquí.

Motivos que se repiten: la **regla de 1 px**, el **par etiqueta-valor en mono** y el **par de corchetes** `[ ]` que envuelve todo lo accionable.

### 2.2 · Transición índice → obra

Es donde vive la continuidad de color, y es lo que hace que el clic no parezca una recarga:

1. Clic en fila → el halo del acento sube a opacidad plena (180 ms).
2. El visor escala hacia el viewport y el acento lo inunda (220 ms).
3. Navegación real. La página de obra **pinta su primer frame con el mismo acento a pantalla completa** y lo retira revelando la cabecera (260 ms).

Implementación: `@view-transition { navigation: auto }` donde exista; *fallback* con una capa `position: fixed` en `--obra-accent` que ambas páginas comparten. Sin framework, sin SPA.

---

## 3 · El momento estrella — EL PANEL

**Escritorio (≥1024 px y `pointer: fine`).** Dos columnas: listado a la izquierda (5 cols), **visor** a la derecha (6 cols, `position: sticky`).

```
┌──────────────────────────────────────────────────────────────┐
│ KBTK digital        OBRAS 04 · ENTREGADAS 03 · DEMOS 07   ES/EN [CONTACTO] │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  01  VISION GROUP BUILDING          ┌────────────────────┐   │
│      CONSTRUCCIÓN · ENTREGADO       │▓▓▓▓ vídeo en curso ▓│   │
│  ──────────────────────────────     │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│   │
│  02  ALBERTO MEDINA                 │▓▓▓▓▓▓ 620×388 ▓▓▓▓▓│   │
│      PELUQUERÍA · ENTREGADO         └────────────────────┘   │
│  ──────────────────────────────      ● EN LÍNEA              │
│  03  FACHADAS VENTILADAS VISIÓN      DESPLEGADA   2026-··    │
│      CONSTRUCCIÓN · ENTREGADO        ALCANCE      DISEÑO+COPY │
│  ──────────────────────────────      ESTADO       ENTREGADO   │
│  04  SOUL BARBER STUDIO                                       │
│      BARBERÍA · CON PERMISO          [ VER LA OBRA ]          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
        ·  halo del acento de la obra activa, 20% opacidad  ·
```

**Estados.**

- **Reposo del panel:** no existe. Siempre hay una obra activa. `SIN SEÑAL` es únicamente el estado intermedio de 40 ms entre dos obras.
- **Conmutación** al señalar otra fila: corte a negro con scanline (120 ms) → hueco `SIN SEÑAL` con guiones en mono (40 ms) → entrada de la nueva (220 ms). Total 380 ms. **Es un corte de hardware, no un crossfade.** El hueco es lo que lo hace recordable y lo que hace que el índice se sienta como un aparato.
- **Fila inactiva:** número y metadatos en `--g1`. **Fila activa:** número y metadatos en `--obra-ink`, hairline a `--line-hi`, fondo `--surface-2`.
- **El acento aparece a tres escalas:** enorme y tenue (halo del lienzo, 20%), media (hairline del bisel y LED), pequeña e intensa (datos de la fila activa). Censo total del acento por pantalla: **cuatro apariciones**. Ni una más.

**Los cuatro criterios de aceptación, respondidos con números:**

**(a) Escalabilidad — 4 → 10 sin tocar layout.**
Una obra es una fila. Añadir la décima es añadir un objeto a `obras.js`. El visor es uno solo y no se multiplica.
- Hasta **12 filas**: listado continuo. Altura de fila 84 px + 1 px de regla → 12 filas = 1 020 px, y el `sticky` del visor cubre ese bloque sin que la columna izquierda quede huérfana.
- A partir de la **fila 13**: agrupación automática por año con una fila-separador en mono. El separador **sale del campo `año`**, no de una decisión de maquetación.
- A partir de **20**: la home lista solo las `destacado: true` (tope 10) y remata con `[ VER LAS 20 OBRAS ]` → `/obras/`, que reusa exactamente el mismo componente de listado sin visor. Ninguna de las tres transiciones toca el CSS de layout.

**(b) Tamaño del protagonista.** Imagen útil del visor: **620 × 388 px** a 1440 · **420 × 262** a 1024 · **350 × 219** a 390. Compuerta de 200 px superada en los tres. Cálculo completo escrito dentro de `tokens-v1.css`.

**(c) Móvil (< 1024 px o `pointer: coarse`).** Mecánica declarada y distinta, no degradada: el listado se convierte en **fichas apiladas**, una por obra, cada una con su poster a sangre, su hairline en su acento y sus datos en mono. **No hay vídeo.** Un `IntersectionObserver` activa la ficha que ocupa ≥ 60 % del viewport y **el halo del fondo toma su acento** — el lienzo sigue reaccionando, con el scroll haciendo de puntero. Tocar la ficha entra en la obra, donde sí vive el vídeo. Mismos datos, misma regla de color, otra vista.

**(d) Nada de scrub.** Prohibido y sustituido. Ver presupuesto.

---

## 4 · Presupuesto técnico y contraste

### 4.1 · Vídeos vivos a la vez

**Escritorio: exactamente 1. Móvil: 0.**

Y no es una limitación: es la mecánica. Solo la máquina que señalas está encendida. Se impone **estructuralmente**, no por disciplina — hay **un único `<video>` en el DOM** y lo que cambia al conmutar es su `src`. `preload="none"`, `poster` obligatorio, `muted loop playsinline`. En móvil ese elemento ni se monta.

**Consecuencia técnica de prohibir el scrub, y es la que arregla el tirón:** el WebM ya no necesita `-g 1`. Aquel *all-keyframe* era obligatorio para poder saltar a un fotograma arbitrario al scrollear, y es exactamente lo que inflaba el fichero a ~5 MB y lo que hacía que se percibiera entrecortado. Con reproducción lineal normal, el mismo plano cabe en **600–900 kB** con GOP estándar. El vídeo pasa de ser el problema a ser gratis.

### 4.2 · Obra oscura sobre lienzo oscuro

Medido antes de decidir: `--surface #14161A` contra `--k #08090B` da **1.10:1**, y ni forzando a `#1A1D22` se pasa de **1.18:1**. En el rango casi-negro **la separación por relleno es imposible**. Así que no se intenta:

1. **Hairline** de 1 px a `rgb(237 238 240 / 0.14)` en reposo → `--obra-accent` al activarse.
2. **Sombra proyectada** real (`0 24px 64px -24px rgb(0 0 0 / .9)`): el visor es un objeto empotrado, no un rectángulo pintado.
3. **Halo del acento** al 20 % detrás del panel: el fondo se aleja porque el objeto emite luz.
4. **La captura en reposo va apagada** — `saturate(.25) brightness(.6)` — y va a plena al activarse. **El contraste no es un estado: es la interacción.** Ahí está la separación real, y es la misma que cuenta la tesis.

Nada de recuadros grises de plantilla.

### 4.3 · Gate de acento

Todo acento medido debe alcanzar **4.5:1 contra `--k`** para su rol de tinta. Si no llega, se aclara solo la tinta y se conserva el acento crudo para halo y hairline. Verificado con un ejemplo real: azul `#2F6FE4` = 4.28:1 → tinta `#3674E5` = 4.54:1. El script vive en el repo y se corre en el Paso 0.

---

## 5 · Brief de movimiento (para código)

Stack: **GSAP 3.15 + ScrollTrigger**, **Lenis 1.3.25 solo en escritorio con puntero fino**. `prefers-reduced-motion` mata todo: sin Lenis, sin reveals (estado final directo), sin autoplay (poster fijo), conmutación instantánea.

| Elemento | Disparador | Movimiento | Duración / easing |
|---|---|---|---|
| Cifras de la barra | carga, 1 vez/sesión | contador mono dígito a dígito | 400 ms · `--ease-out` |
| Filas del índice | ScrollTrigger, `top 80%` | `y 12px → 0`, opacidad, escalonado | 500 ms · 40 ms · `--ease-out` |
| Conmutación del visor | `mouseenter` / `focus` de fila | corte → hueco → entrada | 120 / 40 / 220 ms · `--ease-mech` |
| Halo del lienzo | misma activación | interpolación de `--obra-accent` | 400 ms · `--ease-mech` |
| Scanline | permanente en el visor | deriva vertical de `--scan-y` | 8 s lineal, opacidad 0.06 |
| LED de estado | permanente | parpadeo 1.4 s | opacidad 1 → 0.4 |
| Fichas móviles | IntersectionObserver ≥ 60 % | cambio de halo | 300 ms |
| Índice → obra | clic | ver 2.2 | 180 + 220 + 260 ms |

Sin parallax: hay un `sticky`, y mezclar ambos es cómo se rompen los cálculos de ScrollTrigger. Sin marquee: es el tic de agencia que estamos evitando.

**Accesibilidad, no negociable:** las filas son `<a>` reales. `:focus-visible` activa el visor igual que el hover — el panel se recorre entero con teclado.

---

## 6 · Lista de la compra — MODO CAPTURA

Nada de esto se genera. Todo se captura o se dibuja. **Todos los posters y vídeos se rehacen desde cero** (hay páginas que han cambiado).

### Fila A — por obra (×4)

| Fichero | Rol | Ratio | Presentación | Método |
|---|---|---|---|---|
| `obra-[slug]-poster-v1.jpg` | visor en reposo + ficha móvil | 16:10 | 620 / 350 px | Playwright viewport 1440×900, `reducedMotion: reduce`, primer frame estable |
| `obra-[slug]-scroll-v1.webm` | visor activo | 16:10 | 620 px | captura de scroll a velocidad constante → VP9, **GOP estándar**, CRF 33, 1280×800, sin audio |
| `obra-[slug]-scroll-v1.mp4` | *fallback* Safari | 16:10 | 620 px | H.264, **duración idéntica verificada con ffprobe** |
| `obra-[slug]-antes-v1.jpg` | prueba documental, página de obra | 3:4 | 264 px | captura real de la ficha de Google Maps, sin retocar |
| `obra-[slug]-og-v1.png` | tarjeta al compartir | 1200×630 | — | plantilla HTML capturada en el mismo origen, `fonts.check` antes del disparo. PNG, nunca WebP |

**Duración común obligatoria** para los cuatro vídeos (propuesta: 10 s), y misma velocidad de scroll: si un caso corre más rápido que otro, el panel deja de leerse como un instrumento.

### Fila B — casa

| Fichero | Rol | Nota |
|---|---|---|
| `logo-kbtk-wordmark.svg` | S0 + colofón | dibujado en Archivo Expanded, trazado a curvas. **Sustituye al sello entintado** |
| `og-home-v1.png` | 1200×630 | mismo pipeline que las de obra |
| favicons | 32/180/512 | `apple-touch` sobre fondo sólido: iOS pinta negro la transparencia |
| grano + scanline | — | **no son ficheros**: `feTurbulence` en línea (skill `grano-noise`) y gradiente CSS |

**GPT Image 2: no se usa en este proyecto.** No hay ninguna fila que lo requiera. Si más adelante aparece una textura de atmósfera, entra como fila nueva y nunca afirmando nada sobre una obra.

---

## Compuerta del Paso 1 — verificación

- [x] Tono: dos etiquetas de familias distintas (técnico · Precisión / irreverente · Energía)
- [x] Sensación ancla con hecho verificable, no adjetivo
- [x] El momento estrella se construye sobre ese hecho (el panel expone estado real)
- [x] Protagonista ≥ 200 px: 620 / 420 / 350
- [x] Licencias verificadas: Archivo y Fragment Mono, ambas OFL, auto-alojadas
- [x] `tokens-v1.css` existe como fichero, con escalas completas
- [x] Lista de la compra con el visor como fila más, y ratio común declarado
- [ ] ⚠️ Eje `wdth` de Archivo presente en el woff2 subseteado — **verificar antes del Paso 2**

## Abierto — necesito tu respuesta antes del Paso 2

1. **Métricas reales en la ficha de obra: ¿sí o no?** (bloque 1.2)
2. **Canal de contacto confirmado**: email / WhatsApp / formulario / ninguno.
3. **El sello entintado se retira**: ¿confirmado?
4. **Etiqueta exacta de Soul Barber** en ES y EN. Propuesta: `PUBLICADO CON PERMISO` / `PUBLISHED WITH PERMISSION`.
5. **Fecha de despliegue de cada obra** — va en la ficha y no la tengo.
