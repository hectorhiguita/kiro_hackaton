// InicioView: página de bienvenida con un QR que lleva al sitio de registro.
import QRCode from "qrcode";

/** Construye la URL absoluta al sitio de registro, apta para codificar en el QR. */
export function urlRegistro(): string {
  const { origin, pathname } = window.location;
  // Mantiene el pathname del sitio (p. ej. /repo/) y apunta al hash de registro.
  return `${origin}${pathname}#/registro`;
}

export function renderInicio(
  contenedor: HTMLElement,
  navegar: (ruta: string) => void,
): void {
  const destino = urlRegistro();

  contenedor.innerHTML = `
    <div class="card inicio">
      <h2>Bienvenido al Pasaporte del Hackatón AWS</h2>
      <p>Escanea este código QR con tu teléfono para abrir el registro, o toca el botón.</p>
      <div id="qr-registro" class="qr-registro" aria-label="Código QR para registrarse"></div>
      <p class="qr-url"><a href="${destino}">${destino}</a></p>
      <button id="btn-ir-registro">Registrarme en este dispositivo</button>
    </div>
  `;

  const contenedorQR = contenedor.querySelector<HTMLDivElement>("#qr-registro")!;
  const msjError = "No se pudo generar el código QR; usa el enlace de arriba.";

  QRCode.toCanvas(destino, { width: 256, margin: 1 })
    .then((canvas) => {
      contenedorQR.replaceChildren(canvas);
    })
    .catch(() => {
      contenedorQR.textContent = msjError;
    });

  contenedor
    .querySelector<HTMLButtonElement>("#btn-ir-registro")!
    .addEventListener("click", () => navegar("#/registro"));
}
