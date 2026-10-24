# Implementation Plan: Sistema de asistencia por pasaportes digitales (estático)

## Overview

Este plan convierte el diseño en una serie de tareas de codificación incrementales y guiadas por pruebas. La plataforma es un **sitio 100% estático** alojado en **GitHub Pages**, sin servidor backend, sin funciones serverless y sin base de datos administrada. Toda la lógica corre en el navegador del asistente.

**Stack de implementación (del diseño):**
- **TypeScript** empaquetado como sitio estático con **Vite**.
- **Vitest + fast-check** para pruebas (unitarias, DOM y basadas en propiedades).
- **html5-qrcode** para el escaneo por cámara; `qrcode` solo si se necesita un helper opcional de render.
- **Almacenamiento:** `localStorage` (pasaporte y asistencias) y cookies (identidad de sesión).
- **Catálogo de stands:** `public/stands.json`, activo estático de solo lectura incluido en el build.
- **Despliegue:** GitHub Pages mediante `.github/workflows/pages.yml`.

La lógica de negocio pura (`Validators`, `CatalogService`, `PassportService`, `AttendanceService`, `PortabilityService`) se aísla del almacenamiento detrás de `StorageService` y `CookieService`, sustituibles por dobles en memoria en las pruebas.

**Enfoque de pruebas:**
- **PBT (fast-check)**: una prueba por cada una de las 20 propiedades de corrección del diseño, con **mínimo 100 iteraciones** (`numRuns: 100`), etiquetada `// Feature: event-passport-attendance, Property N: ...`, usando el `StorageService` falso en memoria.
- **Pruebas por ejemplo/DOM**: vistas, cookie, pérdida de datos (Req 7.1) y parseo de URL profunda `?qr=`.
- **Pruebas de humo/configuración**: el build es estático y no referencia backend/DB/`API_BASE_URL`; `stands.json` queda en el output; el catálogo es de solo lectura (congelado).

Las subtareas marcadas con `*` son opcionales (pruebas) y pueden omitirse para un MVP más rápido, aunque se recomienda implementarlas para garantizar corrección.

## Tasks

- [ ] 1. Andamiaje del proyecto (Vite + TypeScript + Vitest + fast-check)
  - [ ] 1.1 Inicializar el proyecto estático y la configuración de build
    - Crear `package.json` con dependencias: `vite`, `typescript`, `vitest`, `fast-check`, `html5-qrcode` (y `qrcode` opcional); scripts `build`, `dev`, `test`, `lint`.
    - Crear `tsconfig.json` (modo estricto) y `vite.config.ts` con `base` relativa para GitHub Pages y salida en `dist/`.
    - Crear la estructura de carpetas: `src/` (con `services/`, `views/`, `infra/`, `models/`), `public/` (activos estáticos), `tests/`.
    - Crear `index.html` mínimo que monte la app y un `src/main.ts` placeholder.
    - _Requirements: 6.1, 6.2_

  - [ ] 1.2 Configurar Vitest con entorno DOM y catálogo de ejemplo
    - Crear `vitest.config.ts` con `environment: 'jsdom'` y helpers de setup.
    - Crear el catálogo de ejemplo `public/stands.json` con `version: 1` y varios stands válidos (`standId`, `nombre`, `codigoQR` únicos), incluyendo al menos una entrada inválida comentada/documentada para pruebas manuales.
    - _Requirements: 3.1, 6.5_

- [ ] 2. Modelos de dominio y tipos de resultado
  - [ ] 2.1 Definir tipos del dominio y `Resultado<T>`
    - En `src/models/` definir `Stand`, `HojaPasaporte`, `Asistencia`, `Pasaporte`, `ProgresoPasaporte`, `PortablePassport` según los Data Models del diseño.
    - Definir `Resultado<T>` (unión `ok: true/false`) y el tipo `CodigoError` con los 10 códigos del diseño.
    - _Requirements: 1.6, 2.6, 5.1, 5.2, 7.2_

- [ ] 3. Adaptadores de plataforma (infra) con dobles en memoria
  - [ ] 3.1 Implementar `StorageService` (localStorage) y su doble en memoria
    - En `src/infra/` definir la interfaz `StorageService` (`getItem`/`setItem`/`removeItem`/`claves`) y una implementación real sobre `localStorage`.
    - Crear un `FakeStorageService` en memoria (basado en `Map`) configurable para **lanzar** en `setItem` (simular `QuotaExceededError`).
    - _Requirements: 6.3_

  - [ ] 3.2 Implementar `CookieService` (document.cookie) y su doble en memoria
    - Definir la interfaz `CookieService` (`setIdentidad`/`getIdentidad`/`limpiarIdentidad`) con serialización de `epa_identidad` a JSON.
    - Crear un `FakeCookieService` en memoria para pruebas.
    - _Requirements: 6.4, 1.6, 7.3_

  - [ ]* 3.3 Escribir pruebas de ejemplo del `CookieService`
    - Verificar escritura, lectura y limpieza de la cookie de identidad.
    - _Requirements: 1.6, 6.4, 7.3_

- [ ] 4. Validadores (funciones puras)
  - [ ] 4.1 Implementar `Validators`
    - Implementar `validarDocumento` (solo dígitos, 5–20; vacío/espacios → `campo_obligatorio`; formato/longitud → `formato_invalido`).
    - Implementar `validarNombre` (trim, 1–100, al menos un carácter no espacio; vacío → `campo_obligatorio`; >100 → `formato_invalido`).
    - Implementar `esStandValido` (nombre trim 1–100 + `codigoQR` presente) y `validarPortable` (forma de importación: `version`, documento/nombre válidos, hojas bien formadas, `visitado ⟺ fechaHora`).
    - _Requirements: 1.1, 1.3, 1.4, 1.5, 3.4, 3.5, 4.6, 7.4_

- [ ] 5. CatalogService (catálogo estático de solo lectura)
  - [ ] 5.1 Implementar `CatalogService`
    - `cargar(url?)` descarga `stands.json` una sola vez (fetch del activo estático), filtra entradas inválidas con `esStandValido` y elimina `codigoQR` duplicados (Req 3.5).
    - `standsValidos()` devuelve una lista **congelada** con `Object.freeze`; `resolverQR(codigoQR)` resuelve un código a su stand o `null`. Sin ningún método de escritura.
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.3_

  - [ ]* 5.2 Prueba de propiedad: entradas inválidas del catálogo ignoradas
    - **Property 12: Entradas inválidas del catálogo son ignoradas**
    - **Validates: Requirements 3.5**
    - Generar catálogos que mezclen entradas válidas e inválidas (nombre vacío, nombre >100 tras recortar, `codigoQR` duplicado); afirmar que `standsValidos()` solo devuelve válidas y sin `codigoQR` duplicados. `numRuns: 100`.

  - [ ]* 5.3 Prueba de humo: catálogo de solo lectura (congelado)
    - Verificar que el objeto devuelto por `standsValidos()` está congelado (`Object.isFrozen`) y que `CatalogService` no expone métodos de escritura.
    - _Requirements: 3.1, 3.2, 3.3_

- [ ] 6. PassportService: creación, reconciliación y progreso
  - [ ] 6.1 Implementar `crearPasaporte` con escritura todo-o-nada
    - Validar documento/nombre; rechazar duplicado local (`documento_existe_local`); construir el `Pasaporte` con una `HojaPasaporte` no visitada por stand válido del catálogo (lista vacía si catálogo vacío).
    - Serializar y persistir en la clave `pasaporte:{documento}` con una **única** `setItem`; capturar fallos devolviendo `escritura_local_fallida` sin dejar pasaporte parcial.
    - _Requirements: 1.1, 1.2, 1.6, 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ]* 6.2 Prueba de propiedad: registro válido crea la cuenta
    - **Property 1: Registro válido crea la cuenta**
    - **Validates: Requirements 1.1, 1.6**
    - Usar `FakeStorageService`. `numRuns: 100`.

  - [ ]* 6.3 Prueba de propiedad: campos obligatorios en blanco rechazados
    - **Property 2: Campos obligatorios en blanco rechazados**
    - **Validates: Requirements 1.3, 1.4**
    - Afirmar `campo_obligatorio` y almacenamiento sin cambios. `numRuns: 100`.

  - [ ]* 6.4 Prueba de propiedad: formato o longitud inválidos rechazados
    - **Property 3: Formato o longitud inválidos rechazados**
    - **Validates: Requirements 1.5**
    - Afirmar `formato_invalido` y almacenamiento sin cambios. `numRuns: 100`.

  - [ ]* 6.5 Prueba de propiedad: unicidad de documento por dispositivo
    - **Property 4: Unicidad de documento por dispositivo**
    - **Validates: Requirements 1.2, 2.1, 2.2**
    - Segundo registro con mismo documento → `documento_existe_local`; exactamente un pasaporte por documento. `numRuns: 100`.

  - [ ]* 6.6 Prueba de propiedad: pasaporte nuevo con una hoja no visitada por stand
    - **Property 5: Pasaporte nuevo con una hoja no visitada por stand del catálogo**
    - **Validates: Requirements 2.3, 2.4**
    - Catálogos de tamaño N (incluido 0); N hojas no visitadas, lista vacía si N=0. `numRuns: 100`.

  - [ ]* 6.7 Prueba de propiedad: consistencia de escritura local en registro
    - **Property 6: Consistencia de escritura local en registro**
    - **Validates: Requirements 2.5**
    - `FakeStorageService` que lanza en `setItem`; afirmar `escritura_local_fallida` y valor previo intacto. `numRuns: 100`.

  - [ ] 6.8 Implementar `reconciliar` y `consultarProgreso`
    - `reconciliar(pasaporte, catalogo)`: transformación pura que agrega hoja no visitada por stand nuevo del catálogo (Req 3.6) y conserva sin cambios hojas de stands ausentes (Req 3.7).
    - `consultarProgreso(documento)`: leer pasaporte; rechazar inexistente con `pasaporte_no_existe_local`; reconciliar y persistir si cambia (todo-o-nada); devolver `visitados`, `total` y hojas con `fechaHora` si y solo si visitado.
    - _Requirements: 2.6, 2.7, 2.8, 3.6, 3.7, 5.1, 5.2, 5.3, 5.4_

  - [ ]* 6.9 Prueba de propiedad: la consulta refleja fielmente el estado
    - **Property 7: La consulta refleja fielmente el estado (fecha si y solo si visitado)**
    - **Validates: Requirements 2.6, 2.7, 5.2, 5.3**
    - `numRuns: 100`.

  - [ ]* 6.10 Prueba de propiedad: consulta de documento no registrado rechazada
    - **Property 8: Consulta de documento no registrado localmente es rechazada**
    - **Validates: Requirements 2.8, 5.4**
    - `numRuns: 100`.

  - [ ]* 6.11 Prueba de propiedad: conteo de progreso consistente
    - **Property 9: Conteo de progreso consistente**
    - **Validates: Requirements 5.1**
    - `visitados` = hojas visitadas, `total` = total, `0 <= visitados <= total`. `numRuns: 100`.

  - [ ]* 6.12 Prueba de propiedad: reconciliación agrega hoja por stand nuevo
    - **Property 10: Reconciliación agrega hoja no visitada por stand nuevo del catálogo**
    - **Validates: Requirements 3.6**
    - `numRuns: 100`.

  - [ ]* 6.13 Prueba de propiedad: reconciliación conserva hojas de stands removidos
    - **Property 11: Reconciliación conserva hojas de stands removidos del catálogo**
    - **Validates: Requirements 3.7**
    - `numRuns: 100`.

- [ ] 7. Checkpoint - Asegurar que todas las pruebas pasan
  - Ejecutar la suite (`npm test`) y `getDiagnostics`. Asegurar que todas las pruebas pasan; preguntar al usuario si surgen dudas.

- [ ] 8. AttendanceService: registro de asistencia por escaneo
  - [ ] 8.1 Implementar `registrarAsistencia` idempotente con escritura todo-o-nada
    - Rechazar documento/`codigoQR` vacío con `campo_faltante` sin cambios (Req 4.6); rechazar sin pasaporte/identidad con `asistente_no_registrado_local` (Req 4.5).
    - Resolver `codigoQR` contra el catálogo en memoria; `qr_invalido` si no existe, sin cambios (Req 4.3).
    - Si la hoja no está visitada: marcar visitada y añadir `Asistencia` con la misma `fechaHora`, persistiendo con una única `setItem` (todo-o-nada); fallo → `escritura_local_fallida` con estado previo intacto (Req 4.2).
    - Si ya visitada: devolver `ya_registrada` conservando la `fechaHora` original (idempotencia, Req 4.4).
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [ ]* 8.2 Prueba de propiedad: escaneo marca la hoja y registra la asistencia juntos
    - **Property 13: Escaneo marca la hoja y registra la asistencia juntos**
    - **Validates: Requirements 4.1**
    - `numRuns: 100`.

  - [ ]* 8.3 Prueba de propiedad: consistencia de escritura local en escaneo
    - **Property 14: Consistencia de escritura local en escaneo**
    - **Validates: Requirements 4.2**
    - `FakeStorageService` que lanza en `setItem`; pasaporte almacenado idéntico al previo. `numRuns: 100`.

  - [ ]* 8.4 Prueba de propiedad: QR inexistente no modifica el pasaporte
    - **Property 15: QR inexistente no modifica el pasaporte**
    - **Validates: Requirements 4.3**
    - `numRuns: 100`.

  - [ ]* 8.5 Prueba de propiedad: re-escaneo idempotente conserva la fecha y hora
    - **Property 16: Re-escaneo idempotente conserva la fecha y hora original**
    - **Validates: Requirements 4.4**
    - `numRuns: 100`.

  - [ ]* 8.6 Prueba de propiedad: escaneo sin identidad registrada rechazado
    - **Property 17: Escaneo sin identidad registrada es rechazado**
    - **Validates: Requirements 4.5**
    - `numRuns: 100`.

  - [ ]* 8.7 Prueba de propiedad: escaneo con campos vacíos rechazado sin efectos
    - **Property 18: Escaneo con campos vacíos rechazado sin efectos**
    - **Validates: Requirements 4.6**
    - `numRuns: 100`.

- [ ] 9. PortabilityService: exportar / importar
  - [ ] 9.1 Implementar `exportar` e `importar`
    - `exportar(documento)`: leer el pasaporte local y producir un `PortablePassport` con `documento`, `nombre` y hojas con estado y `fechaHora`.
    - `importar(entrada)`: validar con `validarPortable`; si inválida → `importacion_invalida` sin tocar `localStorage` (Req 7.4); si válida, crear/reemplazar la clave `pasaporte:{documento}` (derivando asistencias de hojas visitadas) y restaurar la cookie de identidad (Req 7.3).
    - _Requirements: 7.2, 7.3, 7.4_

  - [ ]* 9.2 Prueba de propiedad: exportar/importar round-trip preserva el pasaporte
    - **Property 19: Exportar/Importar round-trip preserva el pasaporte**
    - **Validates: Requirements 7.2, 7.3**
    - Exportar y luego importar en un `FakeStorageService`/`FakeCookieService` limpios reconstruye un pasaporte equivalente y restaura la cookie. `numRuns: 100`.

  - [ ]* 9.3 Prueba de propiedad: importación inválida rechazada sin cambios
    - **Property 20: Importación inválida es rechazada dejando el almacenamiento sin cambios**
    - **Validates: Requirements 7.4**
    - Representaciones inválidas/incompletas → `importacion_invalida` y almacenamiento sin cambios. `numRuns: 100`.

- [ ] 10. Checkpoint - Asegurar que todas las pruebas pasan
  - Ejecutar la suite completa y `getDiagnostics`. Asegurar que todas las pruebas pasan; preguntar al usuario si surgen dudas.

- [ ] 11. Vistas (UI) y cableado de la aplicación
  - [ ] 11.1 Implementar `RegistroView`
    - Formulario documento + nombre; validar con `Validators`, crear pasaporte con `PassportService` y guardar la identidad en la cookie con `CookieService`; mostrar mensajes de error por `CodigoError`.
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 6.4_

  - [ ] 11.2 Implementar `PasaporteView` / `ProgresoView`
    - Mostrar el progreso (visitados/total) y la lista de hojas reconciliadas desde `PassportService.consultarProgreso`; ofrecer exportar/importar mediante `PortabilityService` (importar desde `File`).
    - _Requirements: 2.6, 2.7, 2.8, 5.1, 5.2, 5.3, 7.2, 7.3_

  - [ ] 11.3 Implementar `EscanerView` con html5-qrcode y deep-link `?qr=`
    - Iniciar cámara con `html5-qrcode`; extraer `codigoQR` del QR o del parámetro de URL profunda `#/scan?qr=<token>`; leer documento de la cookie y delegar en `AttendanceService.registrarAsistencia`; mostrar el resultado.
    - _Requirements: 4.1, 4.3, 4.4, 4.5, 4.6_

  - [ ] 11.4 Implementar `CatalogoView` y cablear el enrutado en `main.ts`
    - Mostrar los stands del catálogo (solo lectura); conectar las vistas con un enrutador hash (`#/registro`, `#/pasaporte`, `#/scan`, `#/catalogo`) e inicializar `CatalogService.cargar()` al arrancar.
    - _Requirements: 3.1, 5.1_

  - [ ]* 11.5 Pruebas de ejemplo/DOM de las vistas
    - Testing Library: envío del formulario de registro, render del progreso, manejo del resultado de un escaneo y flujo exportar/importar.
    - _Requirements: 1.1, 2.6, 4.1, 5.1, 7.2, 7.3_

  - [ ]* 11.6 Prueba de ejemplo: pérdida de datos (Req 7.1)
    - Con `localStorage` y cookie vacíos, la app opera como si el asistente no estuviera registrado.
    - _Requirements: 7.1_

  - [ ]* 11.7 Prueba de ejemplo: parseo de deep-link `?qr=`
    - Extraer `?qr=<token>` de la URL y enrutarlo a `AttendanceService`.
    - _Requirements: 4.1_

- [ ] 12. Despliegue estático en GitHub Pages
  - [ ] 12.1 Crear el workflow `.github/workflows/pages.yml`
    - Definir el pipeline de GitHub Actions: `checkout`, `setup-node@v4` (node 20), `npm ci`, `npm run build`, `upload-pages-artifact` (path `dist`) y job `deploy` con `deploy-pages@v4`; permisos `pages: write`, `id-token: write`. Trigger en push a `main`.
    - Asegurar que el build copia `stands.json` al output `dist/`.
    - _Requirements: 6.1, 6.2, 6.5_

  - [ ]* 12.2 Prueba de humo: build estático sin backend/DB
    - Verificar que el output del build (`dist/`) no referencia backend, funciones serverless, base de datos ni `API_BASE_URL`; falla si aparecen esas referencias en el código fuente o en el bundle.
    - _Requirements: 6.1, 6.2, 6.6_

  - [ ]* 12.3 Prueba de humo: `stands.json` incluido en el build
    - Verificar que `stands.json` forma parte del output `dist/` y se sirve como activo estático.
    - _Requirements: 6.5_

- [ ] 13. Checkpoint final - Asegurar que todas las pruebas pasan
  - Ejecutar `npm run build`, la suite completa y `getDiagnostics`. Asegurar que todas las pruebas pasan; preguntar al usuario si surgen dudas.

## Notes

- Las subtareas marcadas con `*` son opcionales (pruebas) y pueden omitirse para un MVP más rápido.
- Cada subtarea referencia sub-requisitos específicos para trazabilidad.
- Las pruebas basadas en propiedades (Properties 1–20) validan las propiedades universales de corrección usando el `StorageService` falso en memoria, con mínimo 100 iteraciones y etiqueta `// Feature: event-passport-attendance, Property N: ...`.
- Las pruebas por ejemplo/DOM cubren vistas, cookie, pérdida de datos y deep-link QR; las de humo cubren las restricciones arquitectónicas del Req 6.
- Los checkpoints aseguran validación incremental.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "2.1"] },
    { "id": 2, "tasks": ["3.1", "3.2", "4.1"] },
    { "id": 3, "tasks": ["3.3", "5.1", "6.1"] },
    { "id": 4, "tasks": ["5.2", "5.3", "6.2", "6.3", "6.4", "6.5", "6.6", "6.7", "6.8"] },
    { "id": 5, "tasks": ["6.9", "6.10", "6.11", "6.12", "6.13", "8.1"] },
    { "id": 6, "tasks": ["8.2", "8.3", "8.4", "8.5", "8.6", "8.7", "9.1"] },
    { "id": 7, "tasks": ["9.2", "9.3", "11.1", "11.2", "11.3", "11.4"] },
    { "id": 8, "tasks": ["11.5", "11.6", "11.7", "12.1"] },
    { "id": 9, "tasks": ["12.2", "12.3"] }
  ]
}
```
