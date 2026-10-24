# Requirements Document

## Introduction

Este documento define los requisitos para un sistema de toma de asistencia a un evento de hackatón de AWS mediante un método de pasaportes digitales. La plataforma es un sitio 100% estático alojado en GitHub Pages, sin servidor backend, sin funciones serverless y sin base de datos administrada. Toda la información del asistente vive en su propio navegador: el pasaporte y los registros de asistencia (stands visitados y marcas de tiempo) se almacenan en el dispositivo mediante almacenamiento local del navegador, mientras que la identidad o sesión del asistente (nombre y número de documento) se mantiene en cookies del navegador.

Cada asistente, al registrarse en la plataforma, obtiene un pasaporte digital creado en su propio navegador y asociado a su número de documento y nombre. El evento cuenta con varios stands, y cada stand dispone de un código QR único. La lista de stands y sus códigos QR se publica como datos estáticos de solo lectura en el repositorio de GitHub (un archivo de catálogo versionado incluido en el sitio estático), definidos por el organizador al momento de publicar, no creados en tiempo de ejecución. Cuando un asistente escanea el código QR de un stand, el sistema resuelve el código contra el catálogo estático y registra la asistencia localmente en el navegador, completando la hoja correspondiente a ese stand dentro de su pasaporte. El objetivo es incentivar el recorrido de los asistentes por los stands del evento.

Como consecuencia de esta arquitectura, no existe un registro central de asistencias: el pasaporte de cada asistente existe únicamente en su propio dispositivo y el organizador no obtiene una vista centralizada de quién visitó cada stand. Esta es una limitación aceptada del diseño.

## Glossary

- **Sistema**: La plataforma de asistencia por pasaportes, compuesta únicamente por archivos estáticos que se ejecutan en el navegador del asistente y gestionan registro, pasaportes, lectura del catálogo de stands y escaneos de códigos QR.
- **Asistente**: Persona que participa en el evento de hackatón de AWS y se registra en la plataforma.
- **Registro**: Proceso mediante el cual un asistente proporciona su número de documento y nombre para crear una cuenta en el navegador de su dispositivo.
- **Número_de_Documento**: Identificador de identidad del asistente (por ejemplo, cédula o documento nacional de identidad), usado como clave del pasaporte en el dispositivo del asistente.
- **Pasaporte**: Representación digital asociada a un único asistente que contiene una hoja por cada stand del evento y que se almacena en el Almacenamiento_Local del navegador del asistente.
- **Hoja_de_Pasaporte**: Sección del pasaporte correspondiente a un stand específico, que registra si el asistente ha visitado dicho stand y la fecha y hora del escaneo.
- **Stand**: Punto físico del evento identificado por un nombre y un código QR único, definido en el Catálogo_de_Stands.
- **Código_QR**: Código de respuesta rápida único asociado a un stand, pre-generado y definido en el Catálogo_de_Stands, usado para registrar la asistencia al escanearlo.
- **Escaneo**: Acción mediante la cual un asistente captura el código QR de un stand con la plataforma para registrar su asistencia en su dispositivo.
- **Asistencia**: Registro que indica que un asistente visitó un stand específico en una fecha y hora determinadas, almacenado en el pasaporte local del asistente.
- **Organizador**: Persona responsable de definir los stands y sus códigos QR en el Catálogo_de_Stands mediante cambios versionados en el repositorio de GitHub.
- **Sitio_Estático**: Aplicación compuesta únicamente por archivos estáticos (HTML, CSS y JavaScript) servidos mediante GitHub Pages, sin un servidor backend ni funciones serverless administradas por el equipo.
- **GitHub_Pages**: Servicio de alojamiento de sitios estáticos de GitHub donde se publica el Sitio_Estático a partir del repositorio del proyecto.
- **Catálogo_de_Stands**: Conjunto de datos estáticos de solo lectura (por ejemplo, un archivo JSON versionado incluido en el sitio estático) que define los stands del evento y sus códigos QR, definido por el Organizador al momento de publicar y no modificable en tiempo de ejecución.
- **Almacenamiento_Local**: Mecanismo de almacenamiento del navegador en el dispositivo del asistente (localStorage) donde se guardan el Pasaporte y los registros de Asistencia.
- **Cookie**: Dato almacenado en el navegador del asistente que la plataforma utiliza para mantener la identidad o sesión del asistente (nombre y número de documento) entre interacciones.

## Requirements

### Requirement 1: Registro de asistentes

**User Story:** Como asistente del hackatón de AWS, quiero registrarme en la plataforma con mi número de documento y nombre, para obtener una cuenta en mi navegador que me identifique durante el evento.

#### Acceptance Criteria

1. WHEN un asistente envía un número de documento compuesto únicamente por dígitos con una longitud entre 5 y 20 caracteres y un nombre con una longitud entre 1 y 100 caracteres que contenga al menos un carácter distinto de espacio en blanco, THE Sistema SHALL crear una cuenta de asistente en el Almacenamiento_Local del navegador asociada a ese número de documento y nombre.
2. IF un asistente envía un número de documento que ya está registrado en el Almacenamiento_Local de ese navegador, THEN THE Sistema SHALL rechazar el registro y devolver un mensaje indicando que el número de documento ya existe en este dispositivo.
3. IF un asistente envía un registro con el número de documento ausente, vacío o compuesto únicamente por espacios en blanco, THEN THE Sistema SHALL rechazar el registro y devolver un mensaje que indique que el número de documento es obligatorio.
4. IF un asistente envía un registro con el nombre ausente, vacío o compuesto únicamente por espacios en blanco, THEN THE Sistema SHALL rechazar el registro y devolver un mensaje que indique que el nombre es obligatorio.
5. IF un asistente envía un número de documento que contiene caracteres distintos de dígitos o cuya longitud está fuera del rango de 5 a 20 caracteres, o un nombre cuya longitud excede 100 caracteres, THEN THE Sistema SHALL rechazar el registro y devolver un mensaje que indique el campo con formato o longitud inválidos.
6. WHEN el registro de un asistente se completa correctamente, THE Sistema SHALL almacenar la identidad del asistente (nombre y número de documento) en una Cookie y devolver una confirmación que incluya el nombre y el número de documento registrados.

### Requirement 2: Asignación del pasaporte digital

**User Story:** Como asistente, quiero que se me asigne un pasaporte digital en mi navegador al registrarme, para poder recolectar las hojas de cada stand durante el evento.

#### Acceptance Criteria

1. WHEN el registro de un asistente se completa correctamente como parte de la misma operación de registro, THE Sistema SHALL crear en el Almacenamiento_Local un pasaporte asociado de forma única al Número_de_Documento de ese asistente.
2. THE Sistema SHALL mantener en el Almacenamiento_Local exactamente un pasaporte por cada asistente registrado en ese navegador, sin permitir cero ni más de uno.
3. WHEN se crea un pasaporte y el Catálogo_de_Stands contiene al menos un stand, THE Sistema SHALL generar una Hoja_de_Pasaporte por cada stand del Catálogo_de_Stands, con estado inicial no visitado.
4. WHEN se crea un pasaporte y el Catálogo_de_Stands no contiene ningún stand, THE Sistema SHALL crear el pasaporte con una lista de hojas vacía.
5. IF durante el registro falla la escritura del pasaporte o de sus hojas en el Almacenamiento_Local, THEN THE Sistema SHALL conservar el Almacenamiento_Local sin un pasaporte parcial y devolver un mensaje indicando que el registro no pudo completarse.
6. WHEN un asistente consulta su pasaporte mediante su Número_de_Documento en el navegador donde está registrado, THE Sistema SHALL devolver el nombre del asistente, el número de documento y la lista de hojas con el estado de visita de cada stand.
7. IF al consultar el pasaporte el nombre del asistente no está disponible, THEN THE Sistema SHALL devolver una respuesta parcial que incluya el número de documento y la lista de hojas disponibles.
8. IF una consulta de pasaporte se realiza con un Número_de_Documento que no corresponde a un pasaporte existente en el Almacenamiento_Local, THEN THE Sistema SHALL rechazar la consulta y devolver un mensaje indicando que el pasaporte no existe en este dispositivo.

### Requirement 3: Catálogo estático de stands y códigos QR

**User Story:** Como organizador del evento, quiero definir los stands y sus códigos QR como datos estáticos de solo lectura en el repositorio, para que la plataforma los lea sin necesidad de un backend que los cree en tiempo de ejecución.

#### Acceptance Criteria

1. THE Sistema SHALL leer los stands del evento exclusivamente desde el Catálogo_de_Stands, que es un conjunto de datos estáticos de solo lectura incluido en el Sitio_Estático.
2. THE Sistema SHALL tratar el Catálogo_de_Stands como de solo lectura en tiempo de ejecución, sin crear, modificar ni eliminar stands desde el navegador del asistente.
3. WHERE el Catálogo_de_Stands define un stand, THE Sistema SHALL utilizar el Código_QR pre-generado declarado para ese stand en el catálogo, sin generar códigos en tiempo de ejecución.
4. THE Sistema SHALL exponer, para cada stand del Catálogo_de_Stands, un nombre con entre 1 y 100 caracteres después de eliminar los espacios iniciales y finales y un Código_QR único dentro del catálogo.
5. IF el Catálogo_de_Stands contiene un stand con el nombre vacío, con el nombre que supera los 100 caracteres después de eliminar los espacios iniciales y finales, o con un Código_QR duplicado respecto de otro stand del catálogo, THEN THE Sistema SHALL ignorar ese stand inválido y continuar operando con los stands válidos del catálogo.
6. WHEN el Catálogo_de_Stands contiene un stand que aún no tiene una Hoja_de_Pasaporte en el pasaporte local del asistente, THE Sistema SHALL agregar una Hoja_de_Pasaporte correspondiente a ese stand en el pasaporte local, con estado inicial no visitado.
7. WHEN el pasaporte local del asistente contiene una Hoja_de_Pasaporte de un stand que ya no está presente en el Catálogo_de_Stands, THE Sistema SHALL conservar esa hoja sin modificar su estado de visita ni su fecha y hora de escaneo.

### Requirement 4: Registro de asistencia mediante escaneo de QR

**User Story:** Como asistente, quiero escanear el código QR de un stand, para registrar mi asistencia a ese stand en mi navegador y completar la hoja correspondiente de mi pasaporte.

#### Acceptance Criteria

1. WHEN un asistente registrado escanea un Código_QR que corresponde a un stand del Catálogo_de_Stands y que aún no está marcado como visitado en su pasaporte local, THE Sistema SHALL registrar en el Almacenamiento_Local una asistencia que asocie al asistente con dicho stand incluyendo la fecha y hora del escaneo y marcar como visitada la Hoja_de_Pasaporte correspondiente a ese stand, de modo que la asistencia y la marca de visita queden guardadas juntas.
2. IF al registrar la asistencia la escritura en el Almacenamiento_Local falla, THEN THE Sistema SHALL conservar el pasaporte local en su estado previo al escaneo y devolver un mensaje indicando que el registro de asistencia no pudo completarse.
3. IF un asistente escanea un Código_QR que no corresponde a ningún stand del Catálogo_de_Stands, THEN THE Sistema SHALL rechazar el registro, conservar el pasaporte local sin cambios y devolver un mensaje indicando que el código QR no es válido.
4. WHEN un asistente escanea nuevamente el Código_QR de un stand que ya tiene marcado como visitado en su pasaporte local, THE Sistema SHALL conservar sin cambios el registro de asistencia original, incluyendo su fecha y hora, y devolver un mensaje indicando que la asistencia a ese stand ya fue registrada.
5. IF un escaneo de Código_QR se realiza sin una identidad de asistente registrada en el navegador, THEN THE Sistema SHALL rechazar el registro y devolver un mensaje indicando que el asistente no está registrado en este dispositivo.
6. IF un escaneo se envía con el número de documento vacío o con el Código_QR vacío, THEN THE Sistema SHALL rechazar el registro, no modificar ningún pasaporte local y devolver un mensaje que indique el campo faltante.

### Requirement 5: Consulta del progreso del pasaporte

**User Story:** Como asistente, quiero consultar el estado de mi pasaporte almacenado en mi navegador, para ver cuántos y cuáles stands he visitado durante el evento.

#### Acceptance Criteria

1. WHEN un asistente registrado consulta su pasaporte mediante su Número_de_Documento, THE Sistema SHALL leer el pasaporte desde el Almacenamiento_Local y devolver la cantidad de stands con Hoja_de_Pasaporte en estado visitado y la cantidad total de stands del pasaporte, donde la cantidad de visitados es mayor o igual a 0 y menor o igual a la cantidad total.
2. WHEN un asistente registrado consulta su pasaporte, THE Sistema SHALL devolver, por cada stand, el nombre del stand, el estado de visita (visitado o no visitado) y, cuando el estado sea visitado, la fecha y hora del escaneo registrado.
3. WHEN un asistente registrado consulta su pasaporte y una Hoja_de_Pasaporte está en estado no visitado, THE Sistema SHALL devolver esa hoja con estado no visitado y sin fecha ni hora de escaneo.
4. IF una consulta de pasaporte se realiza con un Número_de_Documento que no corresponde a un asistente registrado en el Almacenamiento_Local, THEN THE Sistema SHALL rechazar la consulta y devolver un mensaje indicando que el asistente no está registrado en este dispositivo.

### Requirement 6: Restricciones de despliegue y almacenamiento

**User Story:** Como organizador del evento, quiero que la plataforma se despliegue como un sitio estático en GitHub Pages y almacene toda la información en el navegador del asistente, para mantener el proyecto sin servidor, sin funciones serverless y sin base de datos administrada.

#### Acceptance Criteria

1. THE Sistema SHALL desplegarse como un Sitio_Estático en GitHub_Pages, compuesto únicamente por archivos estáticos servidos al navegador del asistente.
2. THE Sistema SHALL operar sin depender de un servidor backend, de funciones serverless ni de una base de datos administrada por el equipo del evento.
3. THE Sistema SHALL almacenar el Pasaporte y los registros de Asistencia en el Almacenamiento_Local del navegador del asistente, en el dispositivo del asistente.
4. WHERE la plataforma requiera mantener la identidad o la sesión del asistente, THE Sistema SHALL utilizar una Cookie en el navegador para almacenar el nombre y el número de documento del asistente.
5. THE Sistema SHALL obtener los stands y sus códigos QR exclusivamente del Catálogo_de_Stands, publicado como datos estáticos de solo lectura en el repositorio de GitHub.
6. THE Sistema SHALL operar sin persistencia central de asistencias y sin ninguna base de datos externa, de modo que el pasaporte de cada asistente exista únicamente en su propio dispositivo.

### Requirement 7: Pérdida y portabilidad de datos locales

**User Story:** Como asistente, quiero entender qué ocurre con mi pasaporte si borro los datos de mi navegador y poder trasladar mi pasaporte entre dispositivos, para no depender de un servidor para conservar mi progreso.

#### Acceptance Criteria

1. IF el asistente borra los datos del navegador (Almacenamiento_Local y Cookie), THEN THE Sistema SHALL operar como si el asistente no estuviera registrado en ese navegador, dado que el pasaporte y la sesión existían únicamente en ese dispositivo.
2. WHEN un asistente registrado solicita exportar su pasaporte, THE Sistema SHALL generar una representación portable del pasaporte local que incluya el nombre, el número de documento y las hojas con su estado de visita y las fechas y horas de escaneo registradas.
3. WHEN un asistente importa una representación portable de pasaporte válida en un navegador, THE Sistema SHALL crear o reemplazar el pasaporte local en el Almacenamiento_Local con el contenido importado y restaurar la identidad del asistente en la Cookie.
4. IF un asistente intenta importar una representación de pasaporte con formato inválido o incompleto, THEN THE Sistema SHALL rechazar la importación, conservar el Almacenamiento_Local sin cambios y devolver un mensaje indicando que los datos de importación no son válidos.
