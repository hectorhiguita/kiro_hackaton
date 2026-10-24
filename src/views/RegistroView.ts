// RegistroView (Tarea 11.1).
import { type PassportService } from "../services/PassportService.ts";
import { type CookieService } from "../infra/CookieService.ts";

export function renderRegistro(
  contenedor: HTMLElement,
  passportService: PassportService,
  cookies: CookieService,
  navegar: (ruta: string) => void,
): void {
  contenedor.innerHTML = `
    <div class="card">
      <h2>Registro de asistente</h2>
      <p>Crea tu pasaporte para el hackatón. Los datos se guardan solo en este dispositivo.</p>
      <label for="documento">Número de documento</label>
      <input id="documento" type="text" inputmode="numeric" placeholder="Ej: 1012345678" />
      <label for="nombre">Nombre</label>
      <input id="nombre" type="text" placeholder="Ej: Ada Lovelace" />
      <button id="btn-registrar">Crear pasaporte</button>
      <div id="msg"></div>
    </div>
  `;

  const docInput = contenedor.querySelector<HTMLInputElement>("#documento")!;
  const nomInput = contenedor.querySelector<HTMLInputElement>("#nombre")!;
  const msg = contenedor.querySelector<HTMLDivElement>("#msg")!;

  const identidad = cookies.getIdentidad();
  if (identidad) {
    docInput.value = identidad.documento;
    nomInput.value = identidad.nombre;
  }

  contenedor.querySelector<HTMLButtonElement>("#btn-registrar")!.addEventListener("click", () => {
    const res = passportService.crearPasaporte(docInput.value, nomInput.value);
    if (res.ok) {
      cookies.setIdentidad(res.valor);
      msg.className = "msg ok";
      msg.textContent = `¡Pasaporte creado para ${res.valor.nombre}! Redirigiendo...`;
      setTimeout(() => navegar("#/pasaporte"), 700);
    } else {
      msg.className = "msg err";
      msg.textContent = res.mensaje;
    }
  });
}
