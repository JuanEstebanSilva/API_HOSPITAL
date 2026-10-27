/**
 * Script para generar tokens JWT de prueba con las credenciales y roles
 * de API_HOSPITAL para inspección y documentación en jwt.io
 */
require("dotenv").config();
const { generarToken, verificarToken } = require("../src/utils/jwt.util");

const usuariosPrueba = [
  {
    id: 1,
    nombre: "Administrador Hospital",
    email: "admin@hospital.com",
    rol: "administrador"
  },
  {
    id: 7,
    nombre: "Médico Hospital",
    email: "medico@hospital.com",
    rol: "medico"
  },
  {
    id: 17,
    nombre: "Paciente Hospital",
    email: "paciente@hospital.com",
    rol: "paciente"
  }
];

console.log("==============================================================================");
console.log("  API_HOSPITAL - TOKENS JWT PARA EVIDENCIA Y VERIFICACIÓN EN JWT.IO");
console.log("==============================================================================\n");

usuariosPrueba.forEach((usr) => {
  const token = generarToken(usr);
  const verificado = verificarToken(token);

  console.log(`[+] ROL: ${usr.rol.toUpperCase()} (${usr.email})`);
  console.log(`    Token: ${token}`);
  console.log(`    Payload decodificado:`);
  console.log(JSON.stringify(verificado, null, 2));
  console.log("------------------------------------------------------------------------------\n");
});
