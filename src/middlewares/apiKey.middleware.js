const {
 buscarClientePorApiKey
} = require("../services/apiKeys.service");
// ========================================
// Validar API Key
// ========================================
const validarApiKey = (req, res, next) => {
 const apiKeyRecibida =
 req.get("X-API-Key");
 // --------------------------------------
 // API Key ausente
 // --------------------------------------
 if (!apiKeyRecibida) {
 return res.status(401).json({
 mensaje: "API Key requerida"
 });
 }
 // --------------------------------------
 // Buscar cliente
 // --------------------------------------
 const cliente =
 buscarClientePorApiKey(apiKeyRecibida);
 if (!cliente) {
 return res.status(401).json({
 mensaje: "API Key inválida"
 });
 }
 // --------------------------------------
 // Verificar estado de la API Key
 // --------------------------------------
 if (!cliente.activa) {
 return res.status(403).json({
 mensaje: "API Key deshabilitada"
 });
 }
 // --------------------------------------
 // Asociar cliente autenticado
 // --------------------------------------
 req.clienteApi = {
 id: cliente.id,
 nombre: cliente.cliente
 };
 next();
};
module.exports = validarApiKey;