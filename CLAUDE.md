# CLAUDE.md

## Puertas

- Antes de servir o desplegar, `npm run check:lighthouse` debe salir en verde: mediana de 5 ejecuciones de Lighthouse móvil sobre `/` y sobre una página de obra, Performance >= 90 (CLS/LCP/TBT se imprimen como referencia, sin bloquear).
- **El umbral de 90 NO se decide contra `dev-server`.** No tiene brotli, ni HTTP/2, ni caché, y su ruido entre tandas del mismo commit llega a 3 puntos de Performance y a 100 ms de TBT. En local sirve para ver la dirección de un cambio y para que no se rompa nada; el número que decide se mide sobre un preview de Vercel.

## Reglas de rendimiento medidas en este proyecto

**`transform` y `opacity` sobre hijos de un SVG NO se compositan.** Cuestan recálculo de estilo y pintado en el hilo principal en cada fotograma que la animación esté activa, cambie de valor o no. Si hay que animar transform u opacidad de algo que vive dentro de un `<svg>`, envolverlo en un `<div>` y animar el div.

**Una animación acotada a su ventana, siempre.** El corolario de lo anterior: una animación cuyo valor ya no cambia sigue pagando por fotograma mientras esté viva, y mantiene la capa promocionada. Escribir `delay + duration` reales en vez de una duración total con `offset`; el relleno hacia atrás y hacia delante da los mismos valores fuera de la ventana. Y cuando una pieza termina lo suyo, `display: none`: acotar la animación quita el trabajo por fotograma, `display:none` quita lo que cuesta seguir estando.

**`var()` sin registrar dentro de `calc()` se re-sustituye en cada recálculo de estilo.** En propiedades animadas —o en elementos que se recalculan por fotograma— usar literales. Medido en las columnas de la cortina: 4,71 → 2,25 ms por fotograma.

**`steps(1, jump-end)` entrega el valor nuevo un milisegundo tarde.** Para un corte duro en un instante exacto —`{delay: ms, duration: 1, fill: "forwards"}`— el salto tiene que ser `steps(1, jump-start)`, que da el valor final en el primer instante del tramo. Con `jump-end` sobre `[ms-1, ms]`, el valor viejo sigue puesto en el propio `ms` y cambia en `ms+1`. No lo caza ningún gate: se ve buscando el instante a mano.

## Deuda conocida

- **Long task de 572 ms en el arranque de S2.** Existe sin overlay de apertura y es el techo real de la home: sin overlay son 90 clavado, no 92. No se ha tocado; cualquier trabajo sobre el umbral de 90 que no la ataque está limando lo que sobra alrededor.
- **El revelado de KBTK anima `clip-path`.** Se intentó cambiarlo por `transform` (dos variantes; las dos reproducen el revelado con menos de 3 de diferencia media), pero las dos exigen pasar de `inset()` a `clip-path: url()` y eso rasteriza el borde superior de las letras de otra manera: la aceptación del relevo pasa de 4,811 a 6,970 sobre un umbral de 8. Revertido. Si se retoma, con la medida hecha en el preview.
