// EscanerView con html5-qrcode y deep-link ?qr= (Tarea 11.3).
import { Html5Qrcode } from "html5-qrcode";
import { type AttendanceService } from "../services/AttendanceService.ts";
import { type CookieService } from "../infra/CookieService.ts";

/** Extrae el token qr de un valor escaneado: acepta el token crudo o una URL con #/scan?qr=token. */
export function extraerCodigoQR(valor: string): string {
  const v = valor.trim();
  const idx = v.indexOf("qr=");
  if (idx !== -1) {
    const resto = v.slice(idx + 3);
    const fin = resto.search(/[&\s]/);
    return decodeURIComponent(fin === -1 ? resto : resto.slice(0, fin));
  }
  return v;
}

export function renderEscaner(
  contenedor: HTMLElement,
  attendance: AttendanceService,
  cookies: CookieService,
  navegar: (ruta: string) => void,
  qrPrecargado?: string,
): void {
  const identidad = cookies.getIdentidad();
  if (!identidad) {
    contenedor.innerHTML = `
      <div class="card">
        <h2>Escanear stand</h2>
        <p>Necesitas un pasaporte registrado en este dispositivo.</p>
        <button id="ir-registro">Registrarme</button>
      </div>`;
    contenedor.querySelector("#ir-registro")!.addEventListener("click", () => navegar("#/registro"));
    return;
  }

  contenedor.innerHTML = `
    <div class="card">
      <h2>Escanear stand</h2>
      <p>Apunta la cámara al código QR del stand.</p>
      <div id="qr-reader" style="width:100%"></div>
      <button id="btn-detener" class="secundario">Detener cámara</button>
      <div id="msg"></div>
    </div>`;

  const msg = contenedor.querySelector<HTMLDivElement>("#msg")!;

  const registrar = (codigo: string) => {
    const res = attendance.registrarAsistencia(identidad.documento, extraerCodigoQR(codigo));
    if (res.ok) {
      msg.className = "msg ok";
      msg.textContent =
        res.valor.estado === "registrada"
          ? `✓ Asistencia registrada en ${res.valor.standNombre}`
          : `Ya habías registrado ${res.valor.standNombre}`;
    } else {
      msg.className = "msg err";
      msg.textContent = res.mensaje;
    }
  };

  // Deep-link: si llega ?qr= en la URL, registrar directamente.
  if (qrPrecargado) {
    registrar(qrPrecargado);
  }

  let lector: Html5Qrcode | null = null;
  try {
    lector = new Html5Qrcode("qr-reader");
    lector
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        (texto) => {
          registrar(texto);
        },
        () => {
          /* ignorar errores de frame */
        },
      )
      .catch(() => {
        msg.className = "msg err";
        msg.textContent = "No se pudo acceder a la cámara. Usa un enlace QR directo.";
      });
  } catch {
    msg.className = "msg err";
    msg.textContent = "La cámara no está disponible en este entorno.";
  }

  contenedor.querySelector("#btn-detener")!.addEventListener("click", () => {
    lector?.stop().catch(() => undefined);
  });
}
