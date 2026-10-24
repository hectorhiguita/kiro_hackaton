// CatalogoView: muestra los stands del catálogo con su QR generado y descargable.
import QRCode from "qrcode";
import { type CatalogService } from "../services/CatalogService.ts";
import { type Stand } from "../models/types.ts";

/** URL deep-link de escaneo para un stand; al escanearla se registra la asistencia. */
export function urlEscaneo(codigoQR: string): string {
  const { origin, pathname } = window.location;
  return `${origin}${pathname}#/scan?qr=${encodeURIComponent(codigoQR)}`;
}

export function renderCatalogo(contenedor: HTMLElement, catalog: CatalogService): void {
  const stands = catalog.standsValidos();

  contenedor.innerHTML = `
    <div class="card">
      <h2>Stands del evento</h2>
      <p>${stands.length} ${stands.length === 1 ? "stand disponible" : "stands disponibles"}. Muestra o imprime el QR de cada stand para que los asistentes lo escaneen.</p>
      <div id="lista-stands" class="stands-grid">
        ${stands.length === 0 ? "<p>No hay stands en el catálogo.</p>" : ""}
      </div>
    </div>`;

  const lista = contenedor.querySelector<HTMLDivElement>("#lista-stands")!;

  for (const stand of stands) {
    lista.appendChild(crearTarjetaStand(stand));
  }
}

function crearTarjetaStand(stand: Stand): HTMLElement {
  const destino = urlEscaneo(stand.codigoQR);

  const tarjeta = document.createElement("div");
  tarjeta.className = "stand-card";
  tarjeta.innerHTML = `
    <h3 class="stand-nombre"></h3>
    <button class="stand-qr" type="button" title="Ampliar QR" aria-label="Ampliar código QR del stand"></button>
    <code class="stand-codigo"></code>
    <button class="secundario btn-descargar">Descargar QR</button>
  `;

  // textContent evita inyección y escapa automáticamente
  tarjeta.querySelector<HTMLHeadingElement>(".stand-nombre")!.textContent = stand.nombre;
  tarjeta.querySelector<HTMLElement>(".stand-codigo")!.textContent = stand.codigoQR;

  const contenedorQR = tarjeta.querySelector<HTMLButtonElement>(".stand-qr")!;
  const btnDescargar = tarjeta.querySelector<HTMLButtonElement>(".btn-descargar")!;

  QRCode.toCanvas(destino, { width: 200, margin: 1 })
    .then((canvas) => {
      contenedorQR.replaceChildren(canvas);
    })
    .catch(() => {
      contenedorQR.textContent = "No se pudo generar el QR";
      contenedorQR.disabled = true;
      btnDescargar.disabled = true;
    });

  // Click en el QR -> abre el popup grande (sin descargar).
  contenedorQR.addEventListener("click", () => abrirModalQR(stand.nombre, destino));

  btnDescargar.addEventListener("click", async () => {
    try {
      const dataUrl = await QRCode.toDataURL(destino, { width: 512, margin: 2 });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `qr-${slug(stand.nombre)}.png`;
      a.click();
    } catch {
      /* ignorar: el QR ya está visible en pantalla */
    }
  });

  return tarjeta;
}

function slug(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Abre un popup grande con el QR del stand (solo visualización, sin descarga). */
export function abrirModalQR(nombreStand: string, destino: string): void {
  const overlay = document.createElement("div");
  overlay.className = "qr-modal-overlay";
  overlay.innerHTML = `
    <div class="qr-modal" role="dialog" aria-modal="true" aria-label="Código QR ampliado">
      <button class="qr-modal-cerrar" type="button" aria-label="Cerrar">&times;</button>
      <h3 class="qr-modal-titulo"></h3>
      <div class="qr-modal-imagen"></div>
      <p class="qr-modal-ayuda">Escanea este código para registrar tu asistencia.</p>
    </div>
  `;

  overlay.querySelector<HTMLHeadingElement>(".qr-modal-titulo")!.textContent = nombreStand;

  const imagen = overlay.querySelector<HTMLDivElement>(".qr-modal-imagen")!;
  // Tamaño grande, ajustado al viewport.
  const lado = Math.min(window.innerWidth, window.innerHeight) * 0.7;
  QRCode.toCanvas(destino, { width: Math.round(lado), margin: 2 })
    .then((canvas) => imagen.replaceChildren(canvas))
    .catch(() => {
      imagen.textContent = "No se pudo generar el QR";
    });

  const cerrar = (): void => {
    document.removeEventListener("keydown", onKey);
    overlay.remove();
  };
  const onKey = (e: KeyboardEvent): void => {
    if (e.key === "Escape") cerrar();
  };

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) cerrar(); // clic fuera del modal
  });
  overlay.querySelector<HTMLButtonElement>(".qr-modal-cerrar")!.addEventListener("click", cerrar);
  document.addEventListener("keydown", onKey);

  document.body.appendChild(overlay);
}
