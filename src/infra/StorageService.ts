// Adaptador de almacenamiento (Tarea 3.1).
// Interfaz fina sobre localStorage, sustituible por un doble en memoria en pruebas.

export interface StorageService {
  getItem(clave: string): string | null;
  setItem(clave: string, valor: string): void; // puede lanzar (p. ej. QuotaExceededError)
  removeItem(clave: string): void;
  claves(): string[];
}

/** Implementación real sobre window.localStorage. */
export class LocalStorageService implements StorageService {
  getItem(clave: string): string | null {
    return window.localStorage.getItem(clave);
  }
  setItem(clave: string, valor: string): void {
    window.localStorage.setItem(clave, valor);
  }
  removeItem(clave: string): void {
    window.localStorage.removeItem(clave);
  }
  claves(): string[] {
    const salida: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k !== null) salida.push(k);
    }
    return salida;
  }
}

/**
 * Doble en memoria para pruebas. Puede configurarse para lanzar en setItem
 * (simula QuotaExceededError) y así verificar la consistencia de escritura local.
 */
export class FakeStorageService implements StorageService {
  private mapa = new Map<string, string>();
  public lanzarEnSetItem = false;

  getItem(clave: string): string | null {
    return this.mapa.has(clave) ? (this.mapa.get(clave) as string) : null;
  }
  setItem(clave: string, valor: string): void {
    if (this.lanzarEnSetItem) {
      throw new DOMException("Cuota excedida (simulada)", "QuotaExceededError");
    }
    this.mapa.set(clave, valor);
  }
  removeItem(clave: string): void {
    this.mapa.delete(clave);
  }
  claves(): string[] {
    return [...this.mapa.keys()];
  }
}
