// RegistroView: portal de autenticación / entrada del asistente (Tarea 11.1).
import { type PassportService } from "../services/PassportService.ts";
import { type CookieService } from "../infra/CookieService.ts";

export function renderRegistro(
  contenedor: HTMLElement,
  passportService: PassportService,
  cookies: CookieService,
  navegar: (ruta: string) => void,
): void {
  const identidad = cookies.getIdentidad();
  const yaRegistrado = identidad !== null;

  contenedor.innerHTML = `
    <div class="card">
      <h2>${yaRegistrado ? "Bienvenido de vuelta" : "Ingresa a tu pasaporte"}</h2>
      <p>
        Regístrate con tu documento y nombre para activar tu pasaporte del evento.
        Luego escanea el código QR de cada stand para marcar tu asistencia.
        Tus datos se guardan solo en este dispositivo.
      </p>
      <label for="documento">Número de documento</label>
      <input id="documento" type="text" inputmode="numeric" autocomplete="off"
             placeholder="Ej: 1012345678" />
      <label for="nombre">Nombre</label>
      <input id="nombre" type="text" autocomplete="name" placeholder="Ej: Ada Lovelace" />
      <button id="btn-registrar">${yaRegistrado ? "Entrar" : "Crear pasaporte"}</button>
      <div id="msg"></div>
    </div>
  `;

  const docInput = contenedor.querySelector<HTMLInputElement>("#documento")!;
  const nomInput = contenedor.querySelector<HTMLInputElement>("#nombre")!;
  const btn = contenedor.querySelector<HTMLButtonElement>("#btn-registrar")!;
  const msg = contenedor.querySelector<HTMLDivElement>("#msg")!;

  if (identidad) {
    docInput.value = identidad.documento;
    nomInput.value = identidad.nombre;
  }

  const autenticar = (): void => {
    const documento = docInput.value;
    const nombre = nomInput.value;

    // Si ya existe un pasaporte para este documento en el dispositivo, entrar directo.
    const progreso = passportService.consultarProgreso(documento.trim());
    if (progreso.ok) {
      cookies.setIdentidad({ documento: progreso.valor.documento, nombre: progreso.valor.nombre ?? nombre.trim() });
      irAPasaporte(progreso.valor.nombre ?? nombre.trim());
      return;
    }

    const res = passportService.crearPasaporte(documento, nombre);
    if (res.ok) {
      cookies.setIdentidad(res.valor);
      irAPasaporte(res.valor.nombre);
    } else {
      msg.className = "msg err";
      msg.textContent = res.mensaje;
    }
  };

  const irAPasaporte = (nombre: string): void => {
    msg.className = "msg ok";
    msg.textContent = `¡Listo, ${nombre}! Abriendo tu pasaporte...`;
    setTimeout(() => navegar("#/pasaporte"), 700);
  };

  btn.addEventListener("click", autenticar);
  nomInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") autenticar();
  });
}
