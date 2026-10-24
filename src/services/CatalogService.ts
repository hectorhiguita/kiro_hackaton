// Catálogo estático de solo lectura (Tarea 5.1).
import { type Stand } from "../models/types.ts";
import { esStandValido } from "./Validators.ts";

export interface CatalogService {
  cargar(url?: string): Promise<void>;
  standsValidos(): ReadonlyArray<Stand>;
  resolverQR(codigoQR: string): Stand | null;
}

/**
 * Filtra entradas inválidas y elimina codigoQR duplicados (Req 3.5).
 * Se conserva la primera aparición de cada codigoQR.
 */
export function filtrarCatalogo(stands: unknown[]): Stand[] {
  const vistos = new Set<string>();
  const salida: Stand[] = [];
  for (const s of stands) {
    if (!esStandValido(s)) continue;
    if (vistos.has(s.codigoQR)) continue;
    vistos.add(s.codigoQR);
    salida.push({ standId: s.standId, nombre: s.nombre.trim(), codigoQR: s.codigoQR });
  }
  return salida;
}

export class HttpCatalogService implements CatalogService {
  private stands: ReadonlyArray<Stand> = Object.freeze([]);

  async cargar(url = "./stands.json"): Promise<void> {
    const resp = await fetch(url);
    const datos = (await resp.json()) as { stands?: unknown[] };
    const lista = Array.isArray(datos.stands) ? datos.stands : [];
    this.stands = Object.freeze(filtrarCatalogo(lista));
  }

  standsValidos(): ReadonlyArray<Stand> {
    return this.stands;
  }

  resolverQR(codigoQR: string): Stand | null {
    return this.stands.find((s) => s.codigoQR === codigoQR) ?? null;
  }
}

/** Catálogo en memoria para pruebas (no requiere fetch). */
export class InMemoryCatalogService implements CatalogService {
  private stands: ReadonlyArray<Stand>;
  constructor(stands: unknown[] = []) {
    this.stands = Object.freeze(filtrarCatalogo(stands));
  }
  async cargar(): Promise<void> {
    // no-op: el catálogo se provee en el constructor
  }
  standsValidos(): ReadonlyArray<Stand> {
    return this.stands;
  }
  resolverQR(codigoQR: string): Stand | null {
    return this.stands.find((s) => s.codigoQR === codigoQR) ?? null;
  }
}
