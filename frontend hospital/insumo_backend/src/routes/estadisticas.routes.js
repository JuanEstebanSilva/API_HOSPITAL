const express = require("express");
const autenticarJWT = require("../middlewares/auth.middleware");
const autorizarRoles = require("../middlewares/roles.middleware");
const { consultar } = require("../config/database");
const router = express.Router();

/**
 * @openapi
 * /api/estadisticas/resumen:
 *   get:
 *     tags: [Estadísticas]
 *     summary: Resumen hospitalario para administradores
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Totales agregados del hospital
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Rol no autorizado
 */
router.get("/resumen", autenticarJWT, autorizarRoles("administrador"), async (req, res, next) => {
  try {
    const resultado = await consultar(`
      SELECT
        (SELECT COUNT(*)::int FROM public.usuarios) AS usuarios,
        (SELECT COUNT(*)::int FROM public.medicos) AS medicos,
        (SELECT COUNT(*)::int FROM public.pacientes) AS pacientes,
        (SELECT COUNT(*)::int FROM public.consultorios) AS consultorios,
        (SELECT COUNT(*)::int FROM public.citas) AS citas
    `);
    res.set("Cache-Control", "no-store");
    return res.status(200).json({ resumen: resultado.rows[0] });
  } catch (error) { return next(error); }
});
module.exports = router;
