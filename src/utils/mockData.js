/**
 * Mock Data for Academic System
 * Provides offline support and realistic dataset matching Django backend schemas
 */

export const MOCK_GRUPOS = [
  { id: 1, grado: "1er Año", seccion: "A", nivel: "Secundaria", tutor: "Prof. María Rodríguez", total_alumnos: 32 },
  { id: 2, grado: "1er Año", seccion: "B", nivel: "Secundaria", tutor: "Prof. José Pérez", total_alumnos: 30 },
  { id: 3, grado: "2do Año", seccion: "A", nivel: "Secundaria", tutor: "Prof. Carlos Gómez", total_alumnos: 28 },
  { id: 4, grado: "2do Año", seccion: "B", nivel: "Secundaria", tutor: "Prof. Ana Martínez", total_alumnos: 29 },
  { id: 5, grado: "3er Año", seccion: "A", nivel: "Secundaria", tutor: "Prof. Luis Fernández", total_alumnos: 31 },
  { id: 6, grado: "4to Año", seccion: "A", nivel: "Secundaria", tutor: "Prof. Elena Torres", total_alumnos: 27 },
  { id: 7, grado: "5to Año", seccion: "A", nivel: "Secundaria", tutor: "Prof. Roberto Silva", total_alumnos: 26 }
];

export const MOCK_REPRESENTANTES = [
  {
    id_representante: 101,
    tipo_documento_identidad: "V",
    numero_documento_identidad: "14890123",
    primer_nombre: "Carmen",
    segundo_nombre: "Elena",
    primer_apellido: "Mendoza",
    segundo_apellido: "Ríos",
    telefono_principal: "+58 414-1234567",
    telefono_secundario: "+58 212-9876543",
    email: "carmen.mendoza@email.com",
    ocupacion: "Ingeniera de Sistemas",
    direccion_trabajo: "Av. Francisco de Miranda, Edif. Centro, Piso 4"
  },
  {
    id_representante: 102,
    tipo_documento_identidad: "V",
    numero_documento_identidad: "12456789",
    primer_nombre: "Ricardo",
    segundo_nombre: "Alberto",
    primer_apellido: "García",
    segundo_apellido: "Morales",
    telefono_principal: "+58 424-7654321",
    telefono_secundario: null,
    email: "ricardo.garcia@email.com",
    ocupacion: "Contador Público",
    direccion_trabajo: "Calle Comercio, Torre Empresarial, Piso 8"
  },
  {
    id_representante: 103,
    tipo_documento_identidad: "E",
    numero_documento_identidad: "84123987",
    primer_nombre: "Sofia",
    segundo_nombre: "Isabel",
    primer_apellido: "Benítez",
    segundo_apellido: "López",
    telefono_principal: "+58 412-5551234",
    telefono_secundario: "+58 416-8889900",
    email: "sofia.benitez@email.com",
    ocupacion: "Docente Universitaria",
    direccion_trabajo: "Ciudad Universitaria, Facultad de Medicina"
  }
];

export const MOCK_DIRECCIONES = [
  {
    id: 1,
    calle: "Av. Principal de Los Palos Grandes, Res. Los Pinos, Apto 3B",
    ciudad: "Caracas",
    estado: "Miranda",
    referencia: "Frente a la plaza principal, al lado de la farmacia"
  },
  {
    id: 2,
    calle: "Calle San Martín, Quinta Esperanza #45",
    ciudad: "Caracas",
    estado: "Distrito Capital",
    referencia: "A dos cuadras de la estación del metro"
  },
  {
    id: 3,
    calle: "Urb. Las Mercedes, Calle Paris, Edif. Montecarlo",
    ciudad: "Caracas",
    estado: "Miranda",
    referencia: "Cerca del centro comercial"
  }
];

export const MOCK_ALUMNOS = [
  {
    id_alumno: 1,
    primer_nombre: "Gabriel",
    segundo_nombre: "Alejandro",
    primer_apellido: "Mendoza",
    segundo_apellido: "García",
    tipo_documento_identidad: "V",
    numero_documento_identidad: "31234567",
    cedula_escolar: "201031234567",
    fecha_nacimiento: "2010-05-14",
    genero: "M",
    lugar_nacimiento: "Caracas, D.C.",
    nacionalidad: "Venezolana",
    grupo_sanguineo: "O+",
    peso_kg: 52.5,
    talla_cm: 165.0,
    fecha_inscripcion_inicial: "2021-09-15",
    estatus_general: "Activo",
    grado: "1er Año",
    seccion: "A",
    grupo_id: 1,
    id_direccion_residencia: MOCK_DIRECCIONES[0],
    representantes: [
      {
        representante: MOCK_REPRESENTANTES[0],
        parentesco: "Madre",
        es_principal: true,
        autorizado_retirar: true
      },
      {
        representante: MOCK_REPRESENTANTES[1],
        parentesco: "Padre",
        es_principal: false,
        autorizado_retirar: true
      }
    ]
  },
  {
    id_alumno: 2,
    primer_nombre: "Valeria",
    segundo_nombre: "Sofia",
    primer_apellido: "García",
    segundo_apellido: "Benítez",
    tipo_documento_identidad: "V",
    numero_documento_identidad: "31876543",
    cedula_escolar: "201131876543",
    fecha_nacimiento: "2011-08-22",
    genero: "F",
    lugar_nacimiento: "Valencia, Carabobo",
    nacionalidad: "Venezolana",
    grupo_sanguineo: "A+",
    peso_kg: 48.0,
    talla_cm: 158.0,
    fecha_inscripcion_inicial: "2022-09-12",
    estatus_general: "Activo",
    grado: "1er Año",
    seccion: "A",
    grupo_id: 1,
    id_direccion_residencia: MOCK_DIRECCIONES[1],
    representantes: [
      {
        representante: MOCK_REPRESENTANTES[1],
        parentesco: "Padre",
        es_principal: true,
        autorizado_retirar: true
      }
    ]
  },
  {
    id_alumno: 3,
    primer_nombre: "Lucas",
    segundo_nombre: "Mateo",
    primer_apellido: "Benítez",
    segundo_apellido: "Ríos",
    tipo_documento_identidad: "V",
    numero_documento_identidad: "30998877",
    cedula_escolar: "200930998877",
    fecha_nacimiento: "2009-11-03",
    genero: "M",
    lugar_nacimiento: "Maracay, Aragua",
    nacionalidad: "Venezolana",
    grupo_sanguineo: "AB-",
    peso_kg: 58.2,
    talla_cm: 171.5,
    fecha_inscripcion_inicial: "2020-09-10",
    estatus_general: "Activo",
    grado: "2do Año",
    seccion: "A",
    grupo_id: 3,
    id_direccion_residencia: MOCK_DIRECCIONES[2],
    representantes: [
      {
        representante: MOCK_REPRESENTANTES[2],
        parentesco: "Madre",
        es_principal: true,
        autorizado_retirar: true
      }
    ]
  },
  {
    id_alumno: 4,
    primer_nombre: "Camila",
    segundo_nombre: "Andrea",
    primer_apellido: "Pérez",
    segundo_apellido: "Sánchez",
    tipo_documento_identidad: "V",
    numero_documento_identidad: "32112233",
    cedula_escolar: "201232112233",
    fecha_nacimiento: "2012-03-30",
    genero: "F",
    lugar_nacimiento: "Caracas, D.C.",
    nacionalidad: "Venezolana",
    grupo_sanguineo: "O-",
    peso_kg: 44.0,
    talla_cm: 152.0,
    fecha_inscripcion_inicial: "2023-09-18",
    estatus_general: "Activo",
    grado: "1er Año",
    seccion: "B",
    grupo_id: 2,
    id_direccion_residencia: MOCK_DIRECCIONES[0],
    representantes: [
      {
        representante: MOCK_REPRESENTANTES[0],
        parentesco: "Tía / Tutora",
        es_principal: true,
        autorizado_retirar: true
      }
    ]
  },
  {
    id_alumno: 5,
    primer_nombre: "Santiago",
    segundo_nombre: "Daniel",
    primer_apellido: "Morales",
    segundo_apellido: "Castillo",
    tipo_documento_identidad: "V",
    numero_documento_identidad: "29554433",
    cedula_escolar: "200829554433",
    fecha_nacimiento: "2008-01-19",
    genero: "M",
    lugar_nacimiento: "Barquisimeto, Lara",
    nacionalidad: "Venezolana",
    grupo_sanguineo: "B+",
    peso_kg: 64.0,
    talla_cm: 176.0,
    fecha_inscripcion_inicial: "2019-09-16",
    estatus_general: "Egresado",
    grado: "5to Año",
    seccion: "A",
    grupo_id: 7,
    id_direccion_residencia: MOCK_DIRECCIONES[1],
    representantes: [
      {
        representante: MOCK_REPRESENTANTES[1],
        parentesco: "Padre",
        es_principal: true,
        autorizado_retirar: true
      }
    ]
  },
  {
    id_alumno: 6,
    primer_nombre: "Isabella",
    segundo_nombre: "Victoria",
    primer_apellido: "Herrera",
    segundo_apellido: "Torres",
    tipo_documento_identidad: "E",
    numero_documento_identidad: "84990011",
    cedula_escolar: "201084990011",
    fecha_nacimiento: "2010-12-05",
    genero: "F",
    lugar_nacimiento: "Bogotá, Colombia",
    nacionalidad: "Colombiana",
    grupo_sanguineo: "A-",
    peso_kg: 50.1,
    talla_cm: 161.0,
    fecha_inscripcion_inicial: "2022-01-10",
    estatus_general: "Retirado",
    grado: "2do Año",
    seccion: "B",
    grupo_id: 4,
    id_direccion_residencia: MOCK_DIRECCIONES[2],
    representantes: [
      {
        representante: MOCK_REPRESENTANTES[2],
        parentesco: "Madre",
        es_principal: true,
        autorizado_retirar: true
      }
    ]
  }
];

export const MOCK_USUARIOS = [
  {
    id: 1,
    nombre_usuario: "mrodriguez",
    email: "m.rodriguez@colegio.edu.ve",
    rol: "Docente",
    is_active: true,
    last_login: "2026-10-03T08:30:00Z"
  },
  {
    id: 2,
    nombre_usuario: "jperez",
    email: "j.perez@colegio.edu.ve",
    rol: "Docente",
    is_active: true,
    last_login: "2026-10-02T14:15:00Z"
  },
  {
    id: 3,
    nombre_usuario: "cgomez",
    email: "c.gomez@colegio.edu.ve",
    rol: "Docente",
    is_active: true,
    last_login: "2026-10-03T07:45:00Z"
  },
  {
    id: 4,
    nombre_usuario: "admin.director",
    email: "direccion@colegio.edu.ve",
    rol: "Administrativo",
    is_active: true,
    last_login: "2026-10-03T09:00:00Z"
  },
  {
    id: 5,
    nombre_usuario: "coord.academica",
    email: "coordinacion@colegio.edu.ve",
    rol: "Administrativo",
    is_active: true,
    last_login: "2026-10-01T11:20:00Z"
  }
];

export const MOCK_PROFESORES = [
  {
    id_profesor: 1,
    cedula: "V-15678901",
    primer_nombre: "María",
    segundo_nombre: "Auxiliadora",
    primer_apellido: "Rodríguez",
    segundo_apellido: "Blanco",
    especialidad: "Matemáticas y Física",
    cargo_departamento: "Coordinadora de Ciencias / Docente Titular",
    telefono: "+58 414-9998877",
    fecha_ingreso: "2015-09-01",
    estatus: "Activo",
    usuario: MOCK_USUARIOS[0]
  },
  {
    id_profesor: 2,
    cedula: "V-16890123",
    primer_nombre: "José",
    segundo_nombre: "Gregorio",
    primer_apellido: "Pérez",
    segundo_apellido: "Suárez",
    especialidad: "Castellano y Literatura",
    cargo_departamento: "Docente de Geografía e Historia",
    telefono: "+58 424-3332211",
    fecha_ingreso: "2018-01-15",
    estatus: "Activo",
    usuario: MOCK_USUARIOS[1]
  },
  {
    id_profesor: 3,
    cedula: "V-18234567",
    primer_nombre: "Carlos",
    segundo_nombre: "Eduardo",
    primer_apellido: "Gómez",
    segundo_apellido: "Navarro",
    especialidad: "Informática y Robótica",
    cargo_departamento: "Jefe de Departamento de Tecnología",
    telefono: "+58 412-1110099",
    fecha_ingreso: "2020-09-01",
    estatus: "Activo",
    usuario: MOCK_USUARIOS[2]
  },
  {
    id_profesor: 4,
    cedula: "V-13456789",
    primer_nombre: "Ana",
    segundo_nombre: "Cristina",
    primer_apellido: "Martínez",
    segundo_apellido: "Linares",
    especialidad: "Biología y Química",
    cargo_departamento: "Laboratorio de Ciencias Naturales",
    telefono: "+58 416-4445566",
    fecha_ingreso: "2016-10-01",
    estatus: "Activo",
    usuario: null
  },
  {
    id_profesor: 5,
    cedula: "V-11223344",
    primer_nombre: "Beatriz",
    segundo_nombre: "Elena",
    primer_apellido: "Vargas",
    segundo_apellido: "Mendoza",
    especialidad: "Gestión Educativa / Administración",
    cargo_departamento: "Directora Académica",
    telefono: "+58 414-0001122",
    fecha_ingreso: "2010-09-01",
    estatus: "Activo",
    usuario: MOCK_USUARIOS[3]
  }
];

export const MOCK_ASISTENCIAS = [
  // 1er Año A
  { id: 101, grupo_id: 1, alumno_id: 1, alumno_nombre: "Gabriel Mendoza", fecha: "2026-10-03", estado: "P", observacion: "A tiempo" },
  { id: 102, grupo_id: 1, alumno_id: 2, alumno_nombre: "Valeria García", fecha: "2026-10-03", estado: "J", observacion: "Llegó 15 min tarde con justificación" },
  { id: 103, grupo_id: 1, alumno_id: 7, alumno_nombre: "Andrés Silva", fecha: "2026-10-03", estado: "P", observacion: "A tiempo" },
  { id: 104, grupo_id: 1, alumno_id: 8, alumno_nombre: "Daniela Rojas", fecha: "2026-10-03", estado: "A", observacion: "Sin justificar" },
  { id: 105, grupo_id: 1, alumno_id: 9, alumno_nombre: "Enrique Castro", fecha: "2026-10-03", estado: "J", observacion: "Cita médica programada" },

  // 1er Año B
  { id: 201, grupo_id: 2, alumno_id: 4, alumno_nombre: "Camila Pérez", fecha: "2026-10-03", estado: "P", observacion: "A tiempo" },
  { id: 202, grupo_id: 2, alumno_id: 10, alumno_nombre: "Mateo Hernández", fecha: "2026-10-03", estado: "P", observacion: "A tiempo" },
  { id: 203, grupo_id: 2, alumno_id: 11, alumno_nombre: "Lucía Delgado", fecha: "2026-10-03", estado: "A", observacion: "Falta por enfermedad" },

  // 2do Año A
  { id: 301, grupo_id: 3, alumno_id: 3, alumno_nombre: "Lucas Benítez", fecha: "2026-10-03", estado: "P", observacion: "A tiempo" },
  { id: 302, grupo_id: 3, alumno_id: 12, alumno_nombre: "Mariana Ortega", fecha: "2026-10-03", estado: "P", observacion: "A tiempo" }
];

export const MOCK_ESTADISTICAS_ASISTENCIA = {
  global: {
    total_estudiantes: 203,
    presentes: 172,
    ausentes: 14,
    justificados: 17,
    porcentaje_asistencia: 84.7,
    porcentaje_efectivo: 90.1
  },
  por_grupo: [
    { grupo_id: 1, grado: "1er Año", seccion: "A", total: 32, presentes: 27, ausentes: 2, justificados: 3, porcentaje: 84.4 },
    { grupo_id: 2, grado: "1er Año", seccion: "B", total: 30, presentes: 26, ausentes: 2, justificados: 2, porcentaje: 86.7 },
    { grupo_id: 3, grado: "2do Año", seccion: "A", total: 28, presentes: 25, ausentes: 1, justificados: 2, porcentaje: 89.2 },
    { grupo_id: 4, grado: "2do Año", seccion: "B", total: 29, presentes: 24, ausentes: 3, justificados: 2, porcentaje: 82.7 },
    { grupo_id: 5, grado: "3er Año", seccion: "A", total: 31, presentes: 26, ausentes: 2, justificados: 3, porcentaje: 83.8 },
    { grupo_id: 6, grado: "4to Año", seccion: "A", total: 27, presentes: 23, ausentes: 2, justificados: 2, porcentaje: 85.1 },
    { grupo_id: 7, grado: "5to Año", seccion: "A", total: 26, presentes: 21, ausentes: 2, justificados: 3, porcentaje: 80.7 }
  ],
  historico_semanal: [
    { dia: "Lunes", fecha: "2026-09-28", porcentaje: 91.2 },
    { dia: "Martes", fecha: "2026-09-29", porcentaje: 88.5 },
    { dia: "Miércoles", fecha: "2026-09-30", porcentaje: 89.0 },
    { dia: "Jueves", fecha: "2026-10-01", porcentaje: 87.4 },
    { dia: "Viernes", fecha: "2026-10-02", porcentaje: 86.0 },
    { dia: "Sábado", fecha: "2026-10-03", porcentaje: 84.7 }
  ]
};

export const initialPersonal = MOCK_PROFESORES;
export const initialProfesores = MOCK_PROFESORES;
export const initialRepresentantes = MOCK_REPRESENTANTES;
export const initialAsistencias = MOCK_ASISTENCIAS;
export const initialAlumnos = MOCK_ALUMNOS;
export const initialGrupos = MOCK_GRUPOS;
export const initialInscripciones = [
  {
    id_inscripcion: 1,
    alumno_id: 1,
    alumno_nombre: "Gabriel Mendoza García",
    alumno_cedula: "201031234567",
    grupo_id: 1,
    grupo_nombre: "1er Año A - 2026-2027",
    grado: "1er Año",
    seccion: "A",
    periodo: "2026-2027",
    fecha_inscripcion: "2021-09-15T08:00:00",
    estado_inscripcion: "Activa",
    monto_pago: 1500.00,
    referencia_bancaria: "BOD-2021-001"
  },
  {
    id_inscripcion: 2,
    alumno_id: 2,
    alumno_nombre: "Valeria García Benítez",
    alumno_cedula: "201131876543",
    grupo_id: 1,
    grupo_nombre: "1er Año A - 2026-2027",
    grado: "1er Año",
    seccion: "A",
    periodo: "2026-2027",
    fecha_inscripcion: "2022-09-12T09:30:00",
    estado_inscripcion: "Activa",
    monto_pago: 1500.00,
    referencia_bancaria: "BOD-2022-002"
  },
  {
    id_inscripcion: 3,
    alumno_id: 3,
    alumno_nombre: "Lucas Benítez Ríos",
    alumno_cedula: "200930998877",
    grupo_id: 3,
    grupo_nombre: "2do Año A - 2026-2027",
    grado: "2do Año",
    seccion: "A",
    periodo: "2026-2027",
    fecha_inscripcion: "2020-09-10T10:00:00",
    estado_inscripcion: "Activa",
    monto_pago: 1500.00,
    referencia_bancaria: "BOD-2020-003"
  },
  {
    id_inscripcion: 4,
    alumno_id: 4,
    alumno_nombre: "Camila Pérez Sánchez",
    alumno_cedula: "201232112233",
    grupo_id: 2,
    grupo_nombre: "1er Año B - 2026-2027",
    grado: "1er Año",
    seccion: "B",
    periodo: "2026-2027",
    fecha_inscripcion: "2023-09-18T11:00:00",
    estado_inscripcion: "Activa",
    monto_pago: 1500.00,
    referencia_bancaria: "BOD-2023-004"
  },
  {
    id_inscripcion: 5,
    alumno_id: 5,
    alumno_nombre: "Santiago Morales Castillo",
    alumno_cedula: "200829554433",
    grupo_id: 7,
    grupo_nombre: "5to Año A - 2026-2027",
    grado: "5to Año",
    seccion: "A",
    periodo: "2026-2027",
    fecha_inscripcion: "2019-09-16T08:30:00",
    estado_inscripcion: "Graduado",
    monto_pago: 1500.00,
    referencia_bancaria: "BOD-2019-005"
  },
  {
    id_inscripcion: 6,
    alumno_id: 6,
    alumno_nombre: "Isabella Herrera Torres",
    alumno_cedula: "201084990011",
    grupo_id: 4,
    grupo_nombre: "2do Año B - 2026-2027",
    grado: "2do Año",
    seccion: "B",
    periodo: "2026-2027",
    fecha_inscripcion: "2022-01-10T09:00:00",
    estado_inscripcion: "Retirado",
    monto_pago: 750.00,
    referencia_bancaria: "BOD-2022-006"
  }
];
