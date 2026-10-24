// PortabilityService: exportar / importar pasaporte (Tarea 9.1).
import {
  type Asistencia,
  type Pasaporte,
  type PortablePassport,
  type Resultado,
  exito,
  fallo,
} from "../models/types.ts";
import { type StorageService } from "../infra/StorageService.ts";
import { type CookieService } from "../infra/CookieService.ts";
import { claveDocumento } from "./PassportService.ts";
import { validarPortable } from "./Validators.ts";

export class PortabilityService {
  constructor(
    private storage: StorageService,
    private cookies: CookieService,
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

  /** Exporta el pasaporte local a JSON portable (Req 7.2). */
  exportar(documento: string): Resultado<PortablePassport> {
    const pasaporte = this.leer(documento);
    if (pasaporte === null) {
      return fallo("pasaporte_no_existe_local", "El pasaporte no existe en este dispositivo");
    }
    const portable: PortablePassport = {
      version: 1,
      documento: pasaporte.documento,
      nombre: pasaporte.nombre ?? "",
      hojas: pasaporte.hojas.map((h) => ({
        standId: h.standId,
        standNombre: h.standNombre,
        visitado: h.visitado,
        ...(h.visitado && h.fechaHora ? { fechaHora: h.fechaHora } : {}),
      })),
    };
    return exito(portable);
  }

  /** Importa una representación portable (Req 7.3, 7.4). */
  importar(entrada: unknown): Resultado<{ documento: string; nombre: string }> {
    const res = validarPortable(entrada);
    if (!res.ok) return res;
    const portable = res.valor;

    const asistencias: Asistencia[] = portable.hojas
      .filter((h) => h.visitado && h.fechaHora)
      .map((h) => ({ standId: h.standId, fechaHora: h.fechaHora as string }));

    const pasaporte: Pasaporte = {
      documento: portable.documento,
      nombre: portable.nombre,
      hojas: portable.hojas.map((h) => ({
        standId: h.standId,
        standNombre: h.standNombre,
        visitado: h.visitado,
        ...(h.visitado && h.fechaHora ? { fechaHora: h.fechaHora } : {}),
      })),
      asistencias,
    };

    try {
      this.storage.setItem(claveDocumento(pasaporte.documento), JSON.stringify(pasaporte));
    } catch {
      return fallo(
        "escritura_local_fallida",
        "No se pudo importar el pasaporte; se conservó el estado previo",
      );
    }

    this.cookies.setIdentidad({ documento: portable.documento, nombre: portable.nombre });
    return exito({ documento: portable.documento, nombre: portable.nombre });
  }
}
