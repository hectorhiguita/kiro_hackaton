// CatalogoView (Tarea 11.4): muestra los stands del catálogo (solo lectura).
import { type CatalogService } from "../services/CatalogService.ts";

export function renderCatalogo(contenedor: HTMLElement, catalog: CatalogService): void {
  const stands = catalog.standsValidos();
  const filas = stands
    .map(
      (s) => `
      <div class="hoja">
        <span>${escapar(s.nombre)}</span>
        <code style="font-size:.75rem;color:#999">${escapar(s.codigoQR)}</code>
      </div>`,
    )
    .join("");
  contenedor.innerHTML = `
    <div class="card">
      <h2>Stands del evento</h2>
      <p>${stands.length} stands disponibles.</p>
      ${filas || "<p>No hay stands en el catálogo.</p>"}
    </div>`;
}

function escapar(s: string): string {
  const div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}
