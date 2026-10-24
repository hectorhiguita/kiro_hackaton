// AttendanceService: registro de asistencia por escaneo (Tarea 8.1).
import {
  type Pasaporte,
  type Resultado,
  exito,
  fallo,
} from "../models/types.ts";
import { type CatalogService } from "./CatalogService.ts";
import { type StorageService } from "../infra/StorageService.ts";
import { claveDocumento, reconciliar } from "./PassportService.ts";

export interface RegistroAsistencia {
  estado: "registrada" | "ya_registrada";
  standNombre: string;
  fechaHora: string;
}

export class AttendanceService {
  constructor(
    private storage: StorageService,
    private catalog: CatalogService,
    private ahora: () => string = () => new Date().toISOString(),
  ) {}

  private leer(documento: string): Pasaporte | null {
    const raw = this.storage.getItem(claveDocumento(documento));
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as Pasaporte;
    } catch {
      return null;
    }
  }

  /** Registra asistencia de forma idempotente con escritura todo-o-nada (Req 4.1–4.6). */
  registrarAsistencia(documento: string, codigoQR: string): Resultado<RegistroAsistencia> {
    const doc = (documento ?? "").trim();
    const qr = (codigoQR ?? "").trim();
    if (doc.length === 0 || qr.length === 0) {
      return fallo("campo_faltante", "Falta el número de documento o el código QR");
    }

    const pasaporteOriginal = this.leer(doc);
    if (pasaporteOriginal === null) {
      return fallo(
        "asistente_no_registrado_local",
        "El asistente no está registrado en este dispositivo",
      );
    }

    const stand = this.catalog.resolverQR(qr);
    if (stand === null) {
      return fallo("qr_invalido", "El código QR no es válido");
    }

    // Reconciliar para asegurar que existe la hoja del stand (Req 3.6).
    const pasaporte = reconciliar(pasaporteOriginal, this.catalog.standsValidos());
    const hoja = pasaporte.hojas.find((h) => h.standId === stand.standId);

    if (hoja && hoja.visitado && hoja.fechaHora) {
      // Idempotencia: conservar la fecha original (Req 4.4).
      return exito({
        estado: "ya_registrada",
        standNombre: stand.nombre,
        fechaHora: hoja.fechaHora,
      });
    }

    const fechaHora = this.ahora();
    const hojas = pasaporte.hojas.map((h) =>
      h.standId === stand.standId ? { ...h, visitado: true, fechaHora } : { ...h },
    );
    const asistencias = [...pasaporte.asistencias, { standId: stand.standId, fechaHora }];
    const actualizado: Pasaporte = { ...pasaporte, hojas, asistencias };

    try {
      this.storage.setItem(claveDocumento(doc), JSON.stringify(actualizado));
    } catch {
      // El valor previo permanece intacto (Req 4.2).
      return fallo(
        "escritura_local_fallida",
        "No se pudo registrar la asistencia; se conservó el estado previo",
      );
    }

    return exito({ estado: "registrada", standNombre: stand.nombre, fechaHora });
  }
}
