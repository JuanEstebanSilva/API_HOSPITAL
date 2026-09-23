const bcrypt = require("bcrypt");
// ========================================
// Cost factor de bcrypt
// ========================================
const SALT_ROUNDS = 12;
// ========================================
// Generar hash de contraseña
// ========================================
const generarPasswordHash = async (password) => {
 const passwordHash = await bcrypt.hash(
 password,
 SALT_ROUNDS
 );
 return passwordHash;
};
// ========================================
// Verificar contraseña
// ========================================
const verificarPassword = async (
 password,
 passwordHash
) => {
 return bcrypt.compare(
 password,
 passwordHash
 );
};
module.exports = {
 generarPasswordHash,
 verificarPassword
};
