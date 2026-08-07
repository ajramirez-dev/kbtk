# Manifiesto de assets — `public/assets/`

Medido con `sharp` (imágenes) y `ffprobe` (vídeo) sobre los ficheros reales en
`public/assets/`, no de memoria. Las 12 piezas son 1280×800 px (ratio 16:10),
10 s de duración en los vídeos — coincide con `--visor-ratio: 16 / 10` fijado
en `docs/tokens-v3.css`.

Anchos de presentación tomados de las variables ya definidas en
`docs/tokens-v3.css`: `--visor-w-desktop: 620px`, `--visor-w-tablet: 420px`,
`--visor-w-mobile: 350px` (cobertura retina calculada allí: 1280/(620·2) ≈ 1.03,
apta).

| Fichero | Obra | Sección destino | Rol | Ratio | Ancho de presentación |
|---|---|---|---|---|---|
| `obra-vision-group-building-poster-v1.jpg` | Vision Group Building | S2 · índice de obras (visor) → página de obra en `src/obras/` | Poster / fallback estático antes de reproducir el vídeo | 1280×800 (16:10) | 620px desktop · 420px tablet · 350px mobile |
| `obra-vision-group-building-scroll-v1.mp4` | Vision Group Building | S2 · índice de obras (visor) → página de obra en `src/obras/` | Vídeo de scroll, formato H.264 (soporte amplio) | 1280×800 (16:10), 10s | 620px desktop · 420px tablet · 350px mobile |
| `obra-vision-group-building-scroll-v1.webm` | Vision Group Building | S2 · índice de obras (visor) → página de obra en `src/obras/` | Vídeo de scroll, formato WebM (alternativa ligera) | 1280×800 (16:10), 10s | 620px desktop · 420px tablet · 350px mobile |
| `obra-fachadas-ventiladas-vision-poster-v1.jpg` | Fachadas Ventiladas Visión | S2 · índice de obras (visor) → página de obra en `src/obras/` | Poster / fallback estático antes de reproducir el vídeo | 1280×800 (16:10) | 620px desktop · 420px tablet · 350px mobile |
| `obra-fachadas-ventiladas-vision-scroll-v1.mp4` | Fachadas Ventiladas Visión | S2 · índice de obras (visor) → página de obra en `src/obras/` | Vídeo de scroll, formato H.264 (soporte amplio) | 1280×800 (16:10), 10s | 620px desktop · 420px tablet · 350px mobile |
| `obra-fachadas-ventiladas-vision-scroll-v1.webm` | Fachadas Ventiladas Visión | S2 · índice de obras (visor) → página de obra en `src/obras/` | Vídeo de scroll, formato WebM (alternativa ligera) | 1280×800 (16:10), 10s | 620px desktop · 420px tablet · 350px mobile |
| `obra-alberto-medina-poster-v1.jpg` | Alberto Medina | S2 · índice de obras (visor) → página de obra en `src/obras/` | Poster / fallback estático antes de reproducir el vídeo | 1280×800 (16:10) | 620px desktop · 420px tablet · 350px mobile |
| `obra-alberto-medina-scroll-v1.mp4` | Alberto Medina | S2 · índice de obras (visor) → página de obra en `src/obras/` | Vídeo de scroll, formato H.264 (soporte amplio) | 1280×800 (16:10), 10s | 620px desktop · 420px tablet · 350px mobile |
| `obra-alberto-medina-scroll-v1.webm` | Alberto Medina | S2 · índice de obras (visor) → página de obra en `src/obras/` | Vídeo de scroll, formato WebM (alternativa ligera) | 1280×800 (16:10), 10s | 620px desktop · 420px tablet · 350px mobile |
| `obra-soul-barber-studio-poster-v1.jpg` | Soul Barber Studio | S2 · índice de obras (visor) → página de obra en `src/obras/` | Poster / fallback estático antes de reproducir el vídeo | 1280×800 (16:10) | 620px desktop · 420px tablet · 350px mobile |
| `obra-soul-barber-studio-scroll-v1.mp4` | Soul Barber Studio | S2 · índice de obras (visor) → página de obra en `src/obras/` | Vídeo de scroll, formato H.264 (soporte amplio) | 1280×800 (16:10), 10s | 620px desktop · 420px tablet · 350px mobile |
| `obra-soul-barber-studio-scroll-v1.webm` | Soul Barber Studio | S2 · índice de obras (visor) → página de obra en `src/obras/` | Vídeo de scroll, formato WebM (alternativa ligera) | 1280×800 (16:10), 10s | 620px desktop · 420px tablet · 350px mobile |

## Pesos reales (referencia, no forma parte de las columnas pedidas)

| Fichero | Peso |
|---|---|
| `obra-alberto-medina-poster-v1.jpg` | 194 KB |
| `obra-fachadas-ventiladas-vision-poster-v1.jpg` | 148 KB |
| `obra-soul-barber-studio-poster-v1.jpg` | 77 KB |
| `obra-vision-group-building-poster-v1.jpg` | 107 KB |
| `obra-alberto-medina-scroll-v1.mp4` | 940 KB |
| `obra-fachadas-ventiladas-vision-scroll-v1.mp4` | 796 KB |
| `obra-soul-barber-studio-scroll-v1.mp4` | 1.1 MB |
| `obra-vision-group-building-scroll-v1.mp4` | 964 KB |
| `obra-alberto-medina-scroll-v1.webm` | 632 KB |
| `obra-fachadas-ventiladas-vision-scroll-v1.webm` | 612 KB |
| `obra-soul-barber-studio-scroll-v1.webm` | 764 KB |
| `obra-vision-group-building-scroll-v1.webm` | 756 KB |
