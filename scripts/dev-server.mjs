// Servidor estático mínimo para verificación local.
// Sirve src/ y public/ fusionados en la misma raíz — así los href
// absolutos ("/obras/...", "/assets/...") resuelven igual que en el
// despliegue final, donde ambas carpetas se combinan en un solo root.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const roots = [path.join(projectRoot, "src"), path.join(projectRoot, "public")];

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".ico": "image/x-icon",
};

const port = process.env.PORT || 5500;

http
  .createServer((req, res) => {
    let urlPath = decodeURIComponent(req.url.split("?")[0]);
    if (urlPath.endsWith("/")) urlPath += "index.html";

    for (const base of roots) {
      const filePath = path.join(base, urlPath);
      if (!filePath.startsWith(base)) continue;
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath);
        // Sin cabecera de cache, un navegador puede aplicar caching
        // heuristico y servir una version vieja de un fichero que ya
        // cambio en disco — confunde cualquier verificacion local sobre
        // si el codigo probado es el actual. Este servidor es solo para
        // verificacion: nunca debe servir nada que no sea lo que hay en
        // disco ahora mismo.
        res.writeHead(200, {
          "Content-Type": MIME[ext] || "application/octet-stream",
          "Cache-Control": "no-store",
        });
        fs.createReadStream(filePath).pipe(res);
        return;
      }
    }

    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found: " + urlPath);
  })
  .listen(port, () => {
    console.log(`Sirviendo src/ + public/ en http://localhost:${port}/`);
  });
