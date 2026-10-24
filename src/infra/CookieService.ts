// Adaptador de cookies de identidad de sesión (Tarea 3.2).

export interface Identidad {
  documento: string;
  nombre: string;
}

export interface CookieService {
  setIdentidad(identidad: Identidad): void; // Req 6.4, 1.6
  getIdentidad(): Identidad | null; // Req 4.5
  limpiarIdentidad(): void; // Req 7.1
}

const NOMBRE_COOKIE = "epa_identidad";

/** Implementación real sobre document.cookie. */
export class DocumentCookieService implements CookieService {
  private dias: number;
  constructor(dias = 7) {
    this.dias = dias;
  }

  setIdentidad(identidad: Identidad): void {
    const valor = encodeURIComponent(JSON.stringify(identidad));
    const expira = new Date(Date.now() + this.dias * 24 * 60 * 60 * 1000).toUTCString();
    const seguro = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${NOMBRE_COOKIE}=${valor}; expires=${expira}; path=/; SameSite=Strict${seguro}`;
  }

  getIdentidad(): Identidad | null {
    const prefijo = `${NOMBRE_COOKIE}=`;
    const cookies = document.cookie ? document.cookie.split("; ") : [];
    for (const c of cookies) {
      if (c.startsWith(prefijo)) {
        try {
          return JSON.parse(decodeURIComponent(c.slice(prefijo.length))) as Identidad;
        } catch {
          return null;
        }
      }
    }
    return null;
  }

  limpiarIdentidad(): void {
    document.cookie = `${NOMBRE_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Strict`;
  }
}

/** Doble en memoria para pruebas. */
export class FakeCookieService implements CookieService {
  private identidad: Identidad | null = null;
  setIdentidad(identidad: Identidad): void {
    this.identidad = { ...identidad };
  }
  getIdentidad(): Identidad | null {
    return this.identidad ? { ...this.identidad } : null;
  }
  limpiarIdentidad(): void {
    this.identidad = null;
  }
}
