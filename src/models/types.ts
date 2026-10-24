// Modelos de dominio y tipos de resultado (Tarea 2.1).

/** Entrada del Catálogo_de_Stands (activo estático de solo lectura). */
export interface Stand {
  standId: string;
  nombre: string; // 1–100 caracteres tras recortar espacios (Req 3.4)
  codigoQR: string; // único dentro del catálogo (Req 3.4)
}

/** Hoja del pasaporte correspondiente a un stand. */
export interface HojaPasaporte {
  standId: string;
  standNombre: string;
  visitado: boolean;
  fechaHora?: string; // presente si y solo si visitado === true (ISO 8601)
}

/** Registro de asistencia a un stand (embebido en el pasaporte). */
export interface Asistencia {
  standId: string;
  fechaHora: string; // ISO 8601
}

/** Pasaporte persistido en localStorage (un blob por documento). */
export interface Pasaporte {
  documento: string;
  nombre?: string;
  hojas: HojaPasaporte[];
  asistencias: Asistencia[];
}

/** Progreso derivado para la UI (Req 5). */
export interface ProgresoPasaporte {
  documento: string;
  nombre?: string;
  visitados: number; // 0 <= visitados <= total (Req 5.1)
  total: number;
  hojas: HojaPasaporte[];
}

/** Representación portable para exportar/importar (Req 7). */
export interface PortablePassport {
  version: 1;
  documento: string;
  nombre: string;
  hojas: Array<{
    standId: string;
    standNombre: string;
    visitado: boolean;
    fechaHora?: string;
  }>;
}

/** Forma del catálogo estático stands.json. */
export interface Catalogo {
  version: number;
  stands: Stand[];
}

/** Códigos de error de dominio (todos del lado cliente). */
export type CodigoError =
  | "campo_obligatorio"
  | "formato_invalido"
  | "documento_existe_local"
  | "pasaporte_no_existe_local"
  | "asistente_no_registrado_local"
  | "qr_invalido"
  | "ya_registrada"
  | "campo_faltante"
  | "escritura_local_fallida"
  | "importacion_invalida";

/** Resultado uniforme: evita excepciones para errores de dominio esperados. */
export type Resultado<T> =
  | { ok: true; valor: T }
  | { ok: false; error: CodigoError; mensaje: string };

export function exito<T>(valor: T): Resultado<T> {
  return { ok: true, valor };
}

export function fallo<T>(error: CodigoError, mensaje: string): Resultado<T> {
  return { ok: false, error, mensaje };
}
