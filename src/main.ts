// Cableado de la aplicación y enrutador hash (Tarea 11.4).
import { LocalStorageService } from "./infra/StorageService.ts";
import { DocumentCookieService } from "./infra/CookieService.ts";
import { HttpCatalogService } from "./services/CatalogService.ts";
import { PassportService } from "./services/PassportService.ts";
import { AttendanceService } from "./services/AttendanceService.ts";
import { PortabilityService } from "./services/PortabilityService.ts";
import { renderInicio } from "./views/InicioView.ts";
import { renderRegistro } from "./views/RegistroView.ts";
import { renderPasaporte } from "./views/PasaporteView.ts";
import { renderEscaner } from "./views/EscanerView.ts";
import { renderCatalogo } from "./views/CatalogoView.ts";

const storage = new LocalStorageService();
const cookies = new DocumentCookieService();
const catalog = new HttpCatalogService();
const passportService = new PassportService(storage, catalog);
const attendance = new AttendanceService(storage, catalog);
const portability = new PortabilityService(storage, cookies);

const app = document.getElementById("app") as HTMLElement;
const nav = document.getElementById("nav") as HTMLElement;

const RUTAS = [
  { hash: "#/inicio", etiqueta: "Inicio" },
  { hash: "#/registro", etiqueta: "Registro" },
  { hash: "#/pasaporte", etiqueta: "Mi pasaporte" },
  { hash: "#/scan", etiqueta: "Escanear" },
  { hash: "#/catalogo", etiqueta: "Stands" },
];

function navegar(ruta: string): void {
  if (window.location.hash === ruta) {
    render();
  } else {
    window.location.hash = ruta;
  }
}

function renderNav(activo: string): void {
  nav.innerHTML = RUTAS.map(
    (r) => `<a href="${r.hash}" class="${r.hash === activo ? "activo" : ""}">${r.etiqueta}</a>`,
  ).join("");
}

function parseHash(): { ruta: string; qr?: string } {
  const h = window.location.hash || "#/inicio";
  const [ruta, query] = h.split("?");
  let qr: string | undefined;
  if (query) {
    const params = new URLSearchParams(query);
    qr = params.get("qr") ?? undefined;
  }
  return { ruta, qr };
}

function render(): void {
  const { ruta, qr } = parseHash();
  renderNav(ruta);
  switch (ruta) {
    case "#/registro":
      renderRegistro(app, passportService, cookies, navegar);
      break;
    case "#/scan":
      renderEscaner(app, attendance, cookies, navegar, qr);
      break;
    case "#/catalogo":
      renderCatalogo(app, catalog);
      break;
    case "#/pasaporte":
      renderPasaporte(app, passportService, portability, cookies, navegar);
      break;
    case "#/inicio":
    default:
      renderInicio(app, navegar);
      break;
  }
}

window.addEventListener("hashchange", render);

async function iniciar(): Promise<void> {
  try {
    await catalog.cargar();
  } catch {
    // Si el catálogo no carga, la app sigue operando con catálogo vacío.
  }
  if (!window.location.hash) {
    window.location.hash = cookies.getIdentidad() ? "#/pasaporte" : "#/inicio";
  }
  render();
}

void iniciar();
