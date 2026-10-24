// PasaporteView / ProgresoView (Tarea 11.2).
import { type PassportService } from "../services/PassportService.ts";
import { type PortabilityService } from "../services/PortabilityService.ts";
import { type CookieService } from "../infra/CookieService.ts";

export function renderPasaporte(
  contenedor: HTMLElement,
  passportService: PassportService,
  portability: PortabilityService,
  cookies: CookieService,
  navegar: (ruta: string) => void,
): void {
  const identidad = cookies.getIdentidad();
  if (!identidad) {
    contenedor.innerHTML = `
      <div class="card">
        <h2>Sin pasaporte</h2>
        <p>No hay un asistente registrado en este dispositivo.</p>
        <button id="ir-registro">Registrarme</button>
      </div>`;
    contenedor.querySelector("#ir-registro")!.addEventListener("click", () => navegar("#/registro"));
    return;
  }

  const res = passportService.consultarProgreso(identidad.documento);
  if (!res.ok) {
    contenedor.innerHTML = `<div class="card"><div class="msg err">${res.mensaje}</div></div>`;
    return;
  }

  const p = res.valor;
  const pct = p.total === 0 ? 0 : Math.round((p.visitados / p.total) * 100);
  const filas = p.hojas
    .map(
      (h) => `
      <div class="hoja">
        <span>${escapar(h.standNombre)}</span>
        <span class="estado ${h.visitado ? "visitado" : "pendiente"}">
          ${h.visitado ? "✓ Visitado" : "Pendiente"}
        </span>
      </div>`,
    )
    .join("");

  contenedor.innerHTML = `
    <div class="card">
      <h2>Pasaporte de ${escapar(p.nombre ?? "")}</h2>
      <p>Documento: ${escapar(p.documento)}</p>
      <p><strong>${p.visitados} / ${p.total}</strong> stands visitados</p>
      <div class="progreso-barra"><div class="progreso-relleno" style="width:${pct}%"></div></div>
      ${filas || "<p>No hay stands en el catálogo todavía.</p>"}
      <button id="btn-exportar" class="secundario">Exportar pasaporte</button>
      <button id="btn-importar" class="secundario">Importar pasaporte</button>
      <input id="file-importar" type="file" accept="application/json" style="display:none" />
      <div id="msg"></div>
    </div>`;

  const msg = contenedor.querySelector<HTMLDivElement>("#msg")!;

  contenedor.querySelector("#btn-exportar")!.addEventListener("click", () => {
    const exp = portability.exportar(identidad.documento);
    if (!exp.ok) {
      msg.className = "msg err";
      msg.textContent = exp.mensaje;
      return;
    }
    const blob = new Blob([JSON.stringify(exp.valor, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pasaporte-${identidad.documento}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  const fileInput = contenedor.querySelector<HTMLInputElement>("#file-importar")!;
  contenedor.querySelector("#btn-importar")!.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", async () => {
    const archivo = fileInput.files?.[0];
    if (!archivo) return;
    try {
      const datos = JSON.parse(await archivo.text());
      const imp = portability.importar(datos);
      if (imp.ok) {
        navegar("#/pasaporte");
      } else {
        msg.className = "msg err";
        msg.textContent = imp.mensaje;
      }
    } catch {
      msg.className = "msg err";
      msg.textContent = "El archivo no es un JSON válido";
    }
  });
}

function escapar(s: string): string {
  const div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}
