// ========================================
// Importaciones
// ========================================

const express =
  require("express");

const router =
  express.Router();

const medicosController =
  require(
    "../controllers/medicos.controller"
  );


// ========================================
// Autenticación y autorización
// ========================================

const autenticarJWT =
  require(
    "../middlewares/auth.middleware"
  );

const autorizarRoles =
  require(
    "../middlewares/roles.middleware"
  );


// ========================================
// Validadores
// ========================================

const {
  validarIdMedico,
  validarIdEspecialidad,
  validarMedico,
  validarMedicoParcial
} = require(
  "../middlewares/medicos.validator"
);

const validar =
  require(
    "../middlewares/validar.middleware"
  );


// ========================================
// Swagger - Schemas
// ========================================

/**
 * @openapi
 * components:
 *   schemas:
 *
 *     Medico:
 *       type: object
 *
 *       properties:
 *
 *         id:
 *           type: integer
 *           example: 1
 *
 *         nombre:
 *           type: string
 *           example: Carlos Rodríguez
 *
 *         registroMedico:
 *           type: string
 *           example: RM-45871
 *
 *         email:
 *           type: string
 *           format: email
 *           example: carlos.rodriguez@hospital.com
 *
 *         telefono:
 *           type: string
 *           example: "3101234567"
 *
 *         especialidadId:
 *           type: integer
 *           example: 2
 *
 *         activo:
 *           type: boolean
 *           example: true
 *
 *
 *     MedicoEntrada:
 *       type: object
 *
 *       required:
 *         - nombre
 *         - registroMedico
 *         - email
 *         - telefono
 *         - especialidadId
 *         - activo
 *
 *       properties:
 *
 *         nombre:
 *           type: string
 *           minLength: 3
 *           maxLength: 100
 *           example: Pedro Martínez
 *
 *         registroMedico:
 *           type: string
 *           example: RM-98765
 *
 *         email:
 *           type: string
 *           format: email
 *           example: pedro.martinez@hospital.com
 *
 *         telefono:
 *           type: string
 *           example: "3114567890"
 *
 *         especialidadId:
 *           type: integer
 *           minimum: 1
 *           example: 2
 *
 *         activo:
 *           type: boolean
 *           example: true
 *
 *
 *     MedicoParcial:
 *       type: object
 *
 *       properties:
 *
 *         nombre:
 *           type: string
 *           example: Pedro Martínez Gómez
 *
 *         registroMedico:
 *           type: string
 *           example: RM-98765
 *
 *         email:
 *           type: string
 *           format: email
 *           example: pedro.nuevo@hospital.com
 *
 *         telefono:
 *           type: string
 *           example: "3201112233"
 *
 *         especialidadId:
 *           type: integer
 *           minimum: 1
 *           example: 3
 *
 *         activo:
 *           type: boolean
 *           example: false
 */


// ========================================
// GET /api/medicos
// Administrador, médico y paciente
// ========================================

/**
 * @openapi
 * /api/medicos:
 *   get:
 *
 *     tags:
 *       - Médicos
 *
 *     summary:
 *       Obtener todos los médicos
 *
 *     description:
 *       Permite consultar la lista de médicos a usuarios
 *       autenticados con rol administrador, médico o paciente.
 *
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *
 *     responses:
 *
 *       200:
 *         description:
 *           Lista de médicos
 *
 *         content:
 *           application/json:
 *
 *             schema:
 *               type: array
 *
 *               items:
 *                 $ref: '#/components/schemas/Medico'
 *
 *       401:
 *         description:
 *           Token ausente, inválido o expirado
 *
 *       403:
 *         description:
 *           El usuario no tiene permisos para acceder
 */
router.get(
  "/",

  autenticarJWT,

  autorizarRoles(
    "administrador",
    "medico",
    "paciente"
  ),

  medicosController
    .obtenerMedicos
);


// ========================================
// GET /api/medicos/especialidad/:especialidadId
// Administrador, médico y paciente
// ========================================

/**
 * @openapi
 * /api/medicos/especialidad/{especialidadId}:
 *   get:
 *
 *     tags:
 *       - Médicos
 *
 *     summary:
 *       Obtener médicos por especialidad
 *
 *     description:
 *       Permite consultar los médicos asociados a una
 *       especialidad. Puede ser utilizada por administradores,
 *       médicos y pacientes.
 *
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *
 *     parameters:
 *
 *       - in: path
 *         name: especialidadId
 *         required: true
 *
 *         schema:
 *           type: integer
 *           minimum: 1
 *
 *         description:
 *           Identificador de la especialidad
 *
 *     responses:
 *
 *       200:
 *         description:
 *           Lista de médicos pertenecientes a la especialidad
 *
 *         content:
 *           application/json:
 *
 *             schema:
 *               type: array
 *
 *               items:
 *                 $ref: '#/components/schemas/Medico'
 *
 *       400:
 *         description:
 *           ID de especialidad inválido
 *
 *       401:
 *         description:
 *           Token ausente, inválido o expirado
 *
 *       403:
 *         description:
 *           El usuario no tiene permisos para acceder
 *
 *       404:
 *         description:
 *           Especialidad no encontrada
 */
router.get(
  "/especialidad/:especialidadId",

  autenticarJWT,

  autorizarRoles(
    "administrador",
    "medico",
    "paciente"
  ),

  validarIdEspecialidad,

  validar,

  medicosController
    .obtenerMedicosPorEspecialidad
);


// ========================================
// GET /api/medicos/:id
// Administrador, médico y paciente
// ========================================

/**
 * @openapi
 * /api/medicos/{id}:
 *   get:
 *
 *     tags:
 *       - Médicos
 *
 *     summary:
 *       Obtener un médico por ID
 *
 *     description:
 *       Permite consultar un médico específico a usuarios
 *       autenticados con rol administrador, médico o paciente.
 *
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *
 *     parameters:
 *
 *       - in: path
 *         name: id
 *         required: true
 *
 *         schema:
 *           type: integer
 *           minimum: 1
 *
 *         description:
 *           Identificador único del médico
 *
 *     responses:
 *
 *       200:
 *         description:
 *           Médico encontrado
 *
 *         content:
 *           application/json:
 *
 *             schema:
 *               $ref: '#/components/schemas/Medico'
 *
 *       400:
 *         description:
 *           ID inválido
 *
 *       401:
 *         description:
 *           Token ausente, inválido o expirado
 *
 *       403:
 *         description:
 *           El usuario no tiene permisos para acceder
 *
 *       404:
 *         description:
 *           Médico no encontrado
 */
router.get(
  "/:id",

  autenticarJWT,

  autorizarRoles(
    "administrador",
    "medico",
    "paciente"
  ),

  validarIdMedico,

  validar,

  medicosController
    .obtenerMedicoPorId
);


// ========================================
// POST /api/medicos
// Solo administrador
// ========================================

/**
 * @openapi
 * /api/medicos:
 *   post:
 *
 *     tags:
 *       - Médicos
 *
 *     summary:
 *       Crear un médico
 *
 *     description:
 *       Solo un usuario con rol administrador puede
 *       crear médicos.
 *
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *
 *     requestBody:
 *       required: true
 *
 *       content:
 *         application/json:
 *
 *           schema:
 *             $ref: '#/components/schemas/MedicoEntrada'
 *
 *     responses:
 *
 *       201:
 *         description:
 *           Médico creado correctamente
 *
 *       400:
 *         description:
 *           Datos inválidos o especialidad inexistente
 *
 *       401:
 *         description:
 *           Token ausente, inválido o expirado
 *
 *       403:
 *         description:
 *           Solo un administrador puede crear médicos
 *
 *       409:
 *         description:
 *           Registro, correo duplicado o especialidad inactiva
 */
router.post(
  "/",

  autenticarJWT,

  autorizarRoles(
    "administrador"
  ),

  validarMedico,

  validar,

  medicosController
    .crearMedico
);


// ========================================
// PUT /api/medicos/:id
// Solo administrador
// ========================================

/**
 * @openapi
 * /api/medicos/{id}:
 *   put:
 *
 *     tags:
 *       - Médicos
 *
 *     summary:
 *       Actualizar completamente un médico
 *
 *     description:
 *       Solo un usuario con rol administrador puede
 *       actualizar completamente un médico.
 *
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *
 *     parameters:
 *
 *       - in: path
 *         name: id
 *         required: true
 *
 *         schema:
 *           type: integer
 *           minimum: 1
 *
 *     requestBody:
 *       required: true
 *
 *       content:
 *         application/json:
 *
 *           schema:
 *             $ref: '#/components/schemas/MedicoEntrada'
 *
 *     responses:
 *
 *       200:
 *         description:
 *           Médico actualizado correctamente
 *
 *       400:
 *         description:
 *           Datos inválidos o especialidad inexistente
 *
 *       401:
 *         description:
 *           Token ausente, inválido o expirado
 *
 *       403:
 *         description:
 *           Solo un administrador puede actualizar médicos
 *
 *       404:
 *         description:
 *           Médico no encontrado
 *
 *       409:
 *         description:
 *           Conflicto con registro, correo o especialidad
 */
router.put(
  "/:id",

  autenticarJWT,

  autorizarRoles(
    "administrador"
  ),

  validarIdMedico,

  validarMedico,

  validar,

  medicosController
    .actualizarMedico
);


// ========================================
// PATCH /api/medicos/:id
// Solo administrador
// ========================================

/**
 * @openapi
 * /api/medicos/{id}:
 *   patch:
 *
 *     tags:
 *       - Médicos
 *
 *     summary:
 *       Actualizar parcialmente un médico
 *
 *     description:
 *       Permite modificar uno o varios campos sin reemplazar
 *       el recurso completo.
 *       Solo un administrador puede realizar esta operación.
 *
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *
 *     parameters:
 *
 *       - in: path
 *         name: id
 *         required: true
 *
 *         schema:
 *           type: integer
 *           minimum: 1
 *
 *     requestBody:
 *       required: true
 *
 *       content:
 *         application/json:
 *
 *           schema:
 *             $ref: '#/components/schemas/MedicoParcial'
 *
 *     responses:
 *
 *       200:
 *         description:
 *           Médico actualizado parcialmente
 *
 *       400:
 *         description:
 *           Datos inválidos, cuerpo vacío o especialidad inexistente
 *
 *       401:
 *         description:
 *           Token ausente, inválido o expirado
 *
 *       403:
 *         description:
 *           Solo un administrador puede actualizar médicos
 *
 *       404:
 *         description:
 *           Médico no encontrado
 *
 *       409:
 *         description:
 *           Conflicto con registro, correo o especialidad
 */
router.patch(
  "/:id",

  autenticarJWT,

  autorizarRoles(
    "administrador"
  ),

  validarIdMedico,

  validarMedicoParcial,

  validar,

  medicosController
    .actualizarMedicoParcial
);


// ========================================
// DELETE /api/medicos/:id
// Solo administrador
// ========================================

/**
 * @openapi
 * /api/medicos/{id}:
 *   delete:
 *
 *     tags:
 *       - Médicos
 *
 *     summary:
 *       Eliminar un médico
 *
 *     description:
 *       Solo un usuario con rol administrador puede
 *       eliminar médicos.
 *
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *
 *     parameters:
 *
 *       - in: path
 *         name: id
 *         required: true
 *
 *         schema:
 *           type: integer
 *           minimum: 1
 *
 *     responses:
 *
 *       200:
 *         description:
 *           Médico eliminado correctamente
 *
 *       400:
 *         description:
 *           ID inválido
 *
 *       401:
 *         description:
 *           Token ausente, inválido o expirado
 *
 *       403:
 *         description:
 *           Solo un administrador puede eliminar médicos
 *
 *       404:
 *         description:
 *           Médico no encontrado
 */
router.delete(
  "/:id",

  autenticarJWT,

  autorizarRoles(
    "administrador"
  ),

  validarIdMedico,

  validar,

  medicosController
    .eliminarMedico
);


// ========================================
// Exportar router
// ========================================

module.exports =
  router;