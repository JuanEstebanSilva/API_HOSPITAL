const crypto = require('node:crypto');
const { pool } = require('../config/database');
const { generarPasswordHash } = require('../utils/password.util');

const hashToken = (token) => crypto.createHash('sha256').update(token, 'utf8').digest('hex');

const generarRecuperacion = async (usuarioId, administradorId) => {
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    const resultado = await cliente.query(
      `SELECT id, activo FROM public.usuarios WHERE id = $1 FOR UPDATE`, [usuarioId]
    );
    if (!resultado.rows.length || !resultado.rows[0].activo) {
      await cliente.query('ROLLBACK');
      return { estado: 'NO_ENCONTRADO' };
    }
    // Solo puede haber un token vigente sin usar por usuario.
    await cliente.query(
      `UPDATE public.password_reset_tokens SET fecha_uso = NOW()
       WHERE usuario_id = $1 AND fecha_uso IS NULL`, [usuarioId]
    );
    const token = crypto.randomBytes(32).toString('hex');
    const guardado = await cliente.query(
      `INSERT INTO public.password_reset_tokens
       (usuario_id, administrador_id, token_hash, fecha_expiracion)
       VALUES ($1, $2, $3, NOW() + INTERVAL '15 minutes')
       RETURNING fecha_expiracion AS "expiraEn"`,
      [usuarioId, administradorId, hashToken(token)]
    );
    await cliente.query('COMMIT');
    return { estado: 'OK', token, expiraEn: guardado.rows[0].expiraEn };
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally { cliente.release(); }
};

const restablecerPassword = async (token, passwordNueva) => {
  // El bcrypt se calcula fuera de la transacción para reducir bloqueos.
  const passwordHash = await generarPasswordHash(passwordNueva);
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    const encontrado = await cliente.query(
      `SELECT t.id, t.usuario_id, t.fecha_expiracion, t.fecha_uso,
              u.activo, u.password_hash
       FROM public.password_reset_tokens t
       JOIN public.usuarios u ON u.id = t.usuario_id
       WHERE t.token_hash = $1 FOR UPDATE OF t, u`, [hashToken(token)]
    );
    const registro = encontrado.rows[0];
    if (!registro || registro.fecha_uso || !registro.activo ||
        new Date(registro.fecha_expiracion).getTime() <= Date.now()) {
      await cliente.query('ROLLBACK');
      return { estado: 'TOKEN_INVALIDO' };
    }
    const { verificarPassword } = require('../utils/password.util');
    if (await verificarPassword(passwordNueva, registro.password_hash)) {
      await cliente.query('ROLLBACK');
      return { estado: 'MISMA_CLAVE' };
    }
    await cliente.query(
      `UPDATE public.usuarios SET password_hash = $1,
       version_sesion = version_sesion + 1 WHERE id = $2`,
      [passwordHash, registro.usuario_id]
    );
    await cliente.query(
      `UPDATE public.password_reset_tokens SET fecha_uso = NOW()
       WHERE usuario_id = $1 AND fecha_uso IS NULL`, [registro.usuario_id]
    );
    await cliente.query(`UPDATE public.codigos_recuperacion SET fecha_uso=NOW()
      WHERE usuario_id=$1 AND fecha_uso IS NULL`, [registro.usuario_id]);
    await cliente.query('COMMIT');
    return { estado: 'OK' };
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally { cliente.release(); }
};

module.exports = { generarRecuperacion, restablecerPassword };
