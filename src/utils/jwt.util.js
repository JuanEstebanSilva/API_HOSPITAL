const jwt = require("jsonwebtoken");
// ========================================
// Obtener configuración JWT
// ========================================
const obtenerConfiguracionJWT = () => {
    const secret = process.env.JWT_SECRET;
    const expiresIn =
        process.env.JWT_EXPIRES_IN || "1h";
    if (!secret) {
        throw new Error(
            "JWT_SECRET no está configurado"
        );
    }
    return {
        secret,
        expiresIn
    };
};
// ========================================
// Generar JWT
// ========================================
const generarToken = (usuario) => {
    const {
        secret,
        expiresIn
    } = obtenerConfiguracionJWT();
    const payload = {
        email: usuario.email,
        rol: usuario.rol
    };
    return jwt.sign(
        payload,
        secret,
        {
            algorithm: "HS256",
            subject: String(usuario.id),
            expiresIn
        }
    );
};
// ========================================
// Verificar JWT
// ========================================
const verificarToken = (token) => {
    const {
        secret
    } = obtenerConfiguracionJWT();
    return jwt.verify(
        token,
        secret,
        {
            algorithms: ["HS256"]
        }
    );
};
module.exports = {
    generarToken,
    verificarToken
};