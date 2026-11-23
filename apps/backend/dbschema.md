// TURBOPRE services - DIAGRAMA DE BASE DE DATOS REAL (Normalizado)
//
// ⚠️ DOCUMENTO HISTÓRICO. El esquema vigente está en prisma/schema.prisma y la
// documentación funcional en docs/domain-model.md. Este archivo se conserva
// solo como referencia del primer borrador.

// ==========================================
// 1. SEGURIDAD Y ORGANIZACIÓN
// ==========================================

Table ROLES {
  id_rol int [pk, increment]
  nombre_rol varchar [not null]
}

Table PROCESOS {
  id_proceso int [pk, increment]
  nombre_proceso varchar [not null]
  id_departamento int [not null]
}

Table PUESTOS_TRABAJO {
  id_puesto int [pk, increment]
  nombre_puesto varchar [not null]
  id_proceso int [ref: > PROCESOS.id_proceso]
}

Table USUARIOS {
  id_usuario int [pk, increment]
  username varchar [unique, not null]
  password_hash varchar [not null] // En la vida real se guarda el hash
  nombre varchar [not null]
  email varchar [unique]
  id_rol int [ref: > ROLES.id_rol]
  id_proceso int [ref: > PROCESOS.id_proceso, null]
  activo boolean [default: true]
  fecha_creacion timestamp [default: `now()`]
}

// ==========================================
// 2. VENTAS Y CLIENTES
// ==========================================

Table CLIENTES {
  id_cliente int [pk, increment]
  nombre_empresa varchar [not null]
  rif varchar [unique]
  contacto varchar
}

Table ALCANCES_VENTAS { // La ODS principal
  id_alcance int [pk, increment]
  nro_ods varchar [not null]
  nro_sub_ods varchar
  id_cliente int [ref: > CLIENTES.id_cliente]
  descripcion text
  equipo_componente varchar
  serial_equipo varchar
  id_estado_actual int [not null, note: "1 al 8 (FSM)"]
  id_creador int [ref: > USUARIOS.id_usuario]
  fecha_registro timestamp [default: `now()`]
}

// ==========================================
// 3. INSPECCIONES (El inicio del flujo)
// ==========================================

Table INSPECCIONES {
  id_inspeccion int [pk, increment]
  id_alcance int [ref: > ALCANCES_VENTAS.id_alcance]
  id_inspector int [ref: > USUARIOS.id_usuario]
  area_taller int [ref: > PROCESOS.id_proceso]
  detalles_tecnicos text
  fecha_asignacion timestamp [default: `now()`]
}

Table HALLAZGOS_INSPECCION {
  id_hallazgo int [pk, increment]
  id_inspeccion int [ref: > INSPECCIONES.id_inspeccion]
  id_operador int [ref: > USUARIOS.id_usuario]
  hallazgos text
  evidencia_url varchar [note: "URL de la foto en la nube"]
  fecha_completado timestamp
}

// ==========================================
// 4. HOJAS DE RUTA (Lo que genera Ingeniería)
// ==========================================

Table HOJAS_RUTA {
  id_hoja_ruta int [pk, increment]
  id_alcance int [ref: > ALCANCES_VENTAS.id_alcance, unique]
  id_ingeniero_creador int [ref: > USUARIOS.id_usuario]
  id_gerente_aprobador int [ref: > USUARIOS.id_usuario, null]
  fecha_creacion timestamp [default: `now()`]
  fecha_aprobacion timestamp
  aprobado boolean [default: false]
  anexo_ingenieria_url varchar
}

Table PASOS_HOJA_RUTA {
  id_paso int [pk, increment]
  id_hoja_ruta int [ref: > HOJAS_RUTA.id_hoja_ruta]
  numero_paso int [not null] // 10, 20, 30...
  id_puesto_trabajo int [ref: > PUESTOS_TRABAJO.id_puesto]
  descripcion_actividad text
  id_operador_ejecutor int [ref: > USUARIOS.id_usuario, null]
  id_puesto_calidad int [ref: > PUESTOS_TRABAJO.id_puesto, null]
  fecha_completado timestamp
  observacion_operador text
}

Table ANEXOS_PASOS {
  id_anexo int [pk, increment]
  id_paso int [ref: > PASOS_HOJA_RUTA.id_paso]
  url_archivo varchar [not null]
  tipo_archivo varchar [note: "Foto, PDF, Plano"]
  fecha_subida timestamp [default: `now()`]
}

// ==========================================
// 5. ALMACÉN Y PROCURA
// ==========================================

Table CATEGORIAS_ALMACEN {
  id_categoria int [pk, increment]
  nombre varchar [not null]
}

Table PRODUCTOS {
  id_producto int [pk, increment]
  id_categoria int [ref: > CATEGORIAS_ALMACEN.id_categoria]
  nombre_equipo varchar [not null]
  serial varchar [unique]
  disponible boolean [default: true]
}

Table SOLICITUDES_ALMACEN {
  id_solicitud int [pk, increment]
  id_alcance int [ref: > ALCANCES_VENTAS.id_alcance]
  id_solicitante int [ref: > USUARIOS.id_usuario]
  id_producto int [ref: > PRODUCTOS.id_producto, null] // Si está en inventario
  repuesto_texto varchar // Si es algo que no está en catálogo
  cantidad int [default: 1]
  motivo text
  estado varchar [note: "PENDIENTE, DESPACHADO, COMPRADO"]
  fecha_solicitud timestamp [default: `now()`]
  fecha_despacho timestamp
}

Table PRESTAMOS_HERRAMIENTAS {
  id_prestamo int [pk, increment]
  id_producto int [ref: > PRODUCTOS.id_producto]
  persona_recibe varchar
  id_autoriza int [ref: > USUARIOS.id_usuario]
  fecha_prestamo timestamp [default: `now()`]
  fecha_devolucion timestamp
}

// ==========================================
// 6. CONTROL Y AUDITORÍA
// ==========================================

Table CALIDAD_APROBACIONES {
  id_aprobacion int [pk, increment]
  id_alcance int [ref: > ALCANCES_VENTAS.id_alcance]
  id_inspector_calidad int [ref: > USUARIOS.id_usuario]
  fecha_evaluacion timestamp [default: `now()`]
  aprobado boolean
  observaciones text
}

Table AUDITORIA_LOGS {
  id_log int [pk, increment]
  id_usuario int [ref: > USUARIOS.id_usuario]
  tabla_afectada varchar
  id_registro_afectado int
  tipo_accion varchar [note: "INSERT, UPDATE, DELETE"]
  detalles_cambio text
  fecha_hora timestamp [default: `now()`]
}