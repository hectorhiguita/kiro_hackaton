// Validadores puros (Tarea 4.1).
import {
  type PortablePassport,
  type Resultado,
  type Stand,
  exito,
  fallo,
} from "../models/types.ts";

const SOLO_DIGITOS = /^[0-9]+$/;

/** Documento: solo dígitos, longitud 5–20 (Req 1.1, 1.3, 1.5). */
export function validarDocumento(documento: string | null | undefined): Resultado<string> {
  const valor = (documento ?? "").trim();
  if (valor.length === 0) {
    return fallo("campo_obligatorio", "El número de documento es obligatorio");
  }
  if (!SOLO_DIGITOS.test(valor) || valor.length < 5 || valor.length > 20) {
    return fallo(
      "formato_invalido",
      "El número de documento debe contener solo dígitos y tener entre 5 y 20 caracteres",
    );
  }
  return exito(valor);
}

/** Nombre: 1–100 caracteres, al menos un carácter no espacio (Req 1.1, 1.4, 1.5). */
export function validarNombre(nombre: string | null | undefined): Resultado<string> {
  const original = nombre ?? "";
  const recortado = original.trim();
  if (recortado.length === 0) {
    return fallo("campo_obligatorio", "El nombre es obligatorio");
  }
  if (original.length > 100) {
    return fallo("formato_invalido", "El nombre no puede exceder 100 caracteres");
  }
  return exito(recortado);
}

/** Valida una entrada del catálogo (Req 3.4, 3.5). */
export function esStandValido(entrada: unknown): entrada is Stand {
  if (typeof entrada !== "object" || entrada === null) return false;
  const e = entrada as Record<string, unknown>;
  if (typeof e.standId !== "string" || e.standId.trim().length === 0) return false;
  if (typeof e.codigoQR !== "string" || e.codigoQR.trim().length === 0) return false;
  if (typeof e.nombre !== "string") return false;
  const nombre = e.nombre.trim();
  return nombre.length >= 1 && nombre.length <= 100;
}

/** Valida una representación portable para importación (Req 7.4). */
export function validarPortable(entrada: unknown): Resultado<PortablePassport> {
  if (typeof entrada !== "object" || entrada === null) {
    return fallo("importacion_invalida", "Los datos de importación no son válidos");
  }
  const e = entrada as Record<string, unknown>;
  if (e.version !== 1) {
    return fallo("importacion_invalida", "Versión de importación no soportada");
  }
  const docRes = validarDocumento(typeof e.documento === "string" ? e.documento : null);
  if (!docRes.ok) {
    return fallo("importacion_invalida", "Documento inválido en la importación");
  }
  const nomRes = validarNombre(typeof e.nombre === "string" ? e.nombre : null);
  if (!nomRes.ok) {
    return fallo("importacion_invalida", "Nombre inválido en la importación");
  }
  if (!Array.isArray(e.hojas)) {
    return fallo("importacion_invalida", "Las hojas de la importación no son válidas");
  }
  for (const h of e.hojas) {
    if (typeof h !== "object" || h === null) {
      return fallo("importacion_invalida", "Hoja mal formada en la importación");
    }
    const hoja = h as Record<string, unknown>;
    if (
      typeof hoja.standId !== "string" ||
      typeof hoja.standNombre !== "string" ||
      typeof hoja.visitado !== "boolean"
    ) {
      return fallo("importacion_invalida", "Hoja mal formada en la importación");
    }
    // visitado ⟺ fechaHora presente
    if (hoja.visitado && typeof hoja.fechaHora !== "string") {
      return fallo("importacion_invalida", "Hoja visitada sin fecha y hora");
    }
    if (!hoja.visitado && hoja.fechaHora !== undefined) {
      return fallo("importacion_invalida", "Hoja no visitada con fecha y hora");
    }
  }
  return exito(entrada as PortablePassport);
}
