const crypto = require('node:crypto');
const { pool } = require('../config/database');
const { generarPasswordHash, verificarPassword } = require('../utils/password.util');

const normalizar = (codigo) => codigo.replace(/-/g, '').toUpperCase();
const hash = (codigo) => crypto.createHash('sha256').update(normalizar(codigo)).digest('hex');
const codigoNuevo = () => crypto.randomBytes(16).toString('hex').toUpperCase().match(/.{1,4}/g).join('-');

async function generar(usuarioId, passwordActual) {
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    const r = await cliente.query('SELECT id, activo, password_hash FROM public.usuarios WHERE id=$1 FOR UPDATE', [usuarioId]);
    const usuario = r.rows[0];
    if (!usuario || !usuario.activo || !(await verificarPassword(passwordActual, usuario.password_hash))) {
      await cliente.query('ROLLBACK');
      return { estado: 'NO_AUTORIZADO' };
    }
    // Serializado por bloqueo de usuario: regeneraciones concurrentes no se pisan.
    await cliente.query('DELETE FROM public.codigos_recuperacion WHERE usuario_id=$1', [usuarioId]);
    const codigos = Array.from({ length: 8 }, codigoNuevo);
    for (const codigo of codigos) {
      await cliente.query('INSERT INTO public.codigos_recuperacion (usuario_id, codigo_hash) VALUES ($1,$2)', [usuarioId, hash(codigo)]);
    }
    await cliente.query('COMMIT');
    return { estado: 'OK', codigos };
  } catch (e) { await cliente.query('ROLLBACK'); throw e; }
  finally { cliente.release(); }
}

async function estado(usuarioId) {
  const r = await pool.query(`SELECT COUNT(*)::int AS disponibles
    FROM public.codigos_recuperacion WHERE usuario_id=$1 AND fecha_uso IS NULL`, [usuarioId]);
  return r.rows[0].disponibles;
}

async function restablecer(email, codigo, passwordNueva) {
  // Bcrypt antes de abrir transacción: evita trabajo pesado bajo bloqueo.
  const passwordHash = await generarPasswordHash(passwordNueva);
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    // Bloqueamos primero el usuario; mismo orden que generación/regeneración.
    const u = await cliente.query(`SELECT id, activo, password_hash FROM public.usuarios
      WHERE email=$1 FOR UPDATE`, [email]);
    const usuario = u.rows[0];
    if (!usuario || !usuario.activo) {
      await cliente.query('ROLLBACK');
      return { estado: 'INVALIDO' };
    }
    const c = await cliente.query(`SELECT id FROM public.codigos_recuperacion
      WHERE usuario_id=$1 AND codigo_hash=$2 AND fecha_uso IS NULL FOR UPDATE`, [usuario.id, hash(codigo)]);
    if (!c.rows.length) {
      await cliente.query('ROLLBACK');
      return { estado: 'INVALIDO' };
    }
    if (await verificarPassword(passwordNueva, usuario.password_hash)) {
      await cliente.query('ROLLBACK');
      return { estado: 'MISMA_CLAVE' };
    }
    await cliente.query(`UPDATE public.usuarios SET password_hash=$1,
      version_sesion=version_sesion+1 WHERE id=$2`, [passwordHash, usuario.id]);
    await cliente.query(`UPDATE public.codigos_recuperacion SET fecha_uso=NOW()
      WHERE id=$1`, [c.rows[0].id]);
    // Tokens administrativos emitidos antes del restablecimiento dejan de servir.
    await cliente.query(`UPDATE public.password_reset_tokens SET fecha_uso=NOW()
      WHERE usuario_id=$1 AND fecha_uso IS NULL`, [usuario.id]);
    await cliente.query('COMMIT');
    return { estado: 'OK' };
  } catch (e) { await cliente.query('ROLLBACK'); throw e; }
  finally { cliente.release(); }
}
module.exports = { generar, estado, restablecer };
