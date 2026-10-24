// PassportService: creación, reconciliación y progreso (Tareas 6.1, 6.8).
import {
  type HojaPasaporte,
  type Pasaporte,
  type ProgresoPasaporte,
  type Resultado,
  type Stand,
  exito,
  fallo,
} from "../models/types.ts";
import { type CatalogService } from "./CatalogService.ts";
import { type StorageService } from "../infra/StorageService.ts";
import { validarDocumento, validarNombre } from "./Validators.ts";

export function claveDocumento(documento: string): string {
  return `pasaporte:${documento}`;
}

/**
 * Reconciliación pura (Req 3.6, 3.7): agrega una hoja no visitada por cada stand
 * del catálogo que falte en el pasaporte y conserva sin cambios las hojas de
 * stands ausentes del catálogo. Devuelve un pasaporte nuevo (no muta el original).
 */
export function reconciliar(pasaporte: Pasaporte, catalogo: ReadonlyArray<Stand>): Pasaporte {
  const porStand = new Map(pasaporte.hojas.map((h) => [h.standId, h]));
  const hojas: HojaPasaporte[] = pasaporte.hojas.map((h) => ({ ...h }));
  for (const stand of catalogo) {
    if (!porStand.has(stand.standId)) {
      hojas.push({ standId: stand.standId, standNombre: stand.nombre, visitado: false });
    }
  }
  return { ...pasaporte, hojas };
}

function hojasIguales(a: HojaPasaporte[], b: HojaPasaporte[]): boolean {
  return a.length === b.length;
}

export class PassportService {
  constructor(
    private storage: StorageService,
    private catalog: CatalogService,
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

  /** Escritura todo-o-nada a nivel de blob JSON (Req 2.5, 4.2). */
  private persistir(pasaporte: Pasaporte): Resultado<Pasaporte> {
    try {
      const serializado = JSON.stringify(pasaporte);
      this.storage.setItem(claveDocumento(pasaporte.documento), serializado);
      return exito(pasaporte);
    } catch {
      return fallo(
        "escritura_local_fallida",
        "No se pudo completar la operación; se conservó el estado previo",
      );
    }
  }

  /** Crea el pasaporte (Req 1.1, 1.2, 1.6, 2.1–2.5). */
  crearPasaporte(
    documento: string,
    nombre: string,
  ): Resultado<{ documento: string; nombre: string }> {
    const docRes = validarDocumento(documento);
    if (!docRes.ok) return docRes;
    const nomRes = validarNombre(nombre);
    if (!nomRes.ok) return nomRes;

    const doc = docRes.valor;
    const nom = nomRes.valor;

    if (this.storage.getItem(claveDocumento(doc)) !== null) {
      return fallo("documento_existe_local", "El número de documento ya existe en este dispositivo");
    }

    const hojas: HojaPasaporte[] = this.catalog.standsValidos().map((s) => ({
      standId: s.standId,
      standNombre: s.nombre,
      visitado: false,
    }));

    const pasaporte: Pasaporte = { documento: doc, nombre: nom, hojas, asistencias: [] };
    const res = this.persistir(pasaporte);
    if (!res.ok) return res;
    return exito({ documento: doc, nombre: nom });
  }

  /** Consulta progreso reconciliado (Req 2.6–2.8, 3.6, 3.7, 5.1–5.4). */
  consultarProgreso(documento: string): Resultado<ProgresoPasaporte> {
    const pasaporte = this.leer(documento);
    if (pasaporte === null) {
      return fallo("pasaporte_no_existe_local", "El pasaporte no existe en este dispositivo");
    }

    const reconciliado = reconciliar(pasaporte, this.catalog.standsValidos());
    if (!hojasIguales(reconciliado.hojas, pasaporte.hojas)) {
      // persistir la reconciliación (todo-o-nada); si falla, seguimos con lo leído
      this.persistir(reconciliado);
    }

    const visitados = reconciliado.hojas.filter((h) => h.visitado).length;
    return exito({
      documento: reconciliado.documento,
      nombre: reconciliado.nombre,
      visitados,
      total: reconciliado.hojas.length,
      hojas: reconciliado.hojas.map((h) => ({ ...h })),
    });
  }
}
