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
    <div class="stand-qr" aria-label="Código QR del stand"></div>
    <code class="stand-codigo"></code>
    <button class="secundario btn-descargar">Descargar QR</button>
  `;

  // textContent evita inyección y escapa automáticamente
  tarjeta.querySelector<HTMLHeadingElement>(".stand-nombre")!.textContent = stand.nombre;
  tarjeta.querySelector<HTMLElement>(".stand-codigo")!.textContent = stand.codigoQR;

  const contenedorQR = tarjeta.querySelector<HTMLDivElement>(".stand-qr")!;
  const btnDescargar = tarjeta.querySelector<HTMLButtonElement>(".btn-descargar")!;

  QRCode.toCanvas(destino, { width: 200, margin: 1 })
    .then((canvas) => {
      contenedorQR.replaceChildren(canvas);
    })
    .catch(() => {
      contenedorQR.textContent = "No se pudo generar el QR";
      btnDescargar.disabled = true;
    });

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
