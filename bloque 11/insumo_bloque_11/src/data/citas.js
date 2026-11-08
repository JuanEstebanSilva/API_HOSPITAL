const citas = [
  {
    id: 1,
    pacienteId: 1,
    medicoId: 1,
    consultorioId: 2,
    fecha: "2026-09-15",
    hora: "10:30",
    motivo: "Consulta de control",
    estado: "programada"
  },

  {
    id: 2,
    pacienteId: 2,
    medicoId: 2,
    consultorioId: 4,
    fecha: "2026-09-15",
    hora: "11:00",
    motivo: "Consulta pediátrica",
    estado: "confirmada"
  },

  {
    id: 3,
    pacienteId: 3,
    medicoId: 3,
    consultorioId: 1,
    fecha: "2026-09-16",
    hora: "09:00",
    motivo: "Valoración médica general",
    estado: "programada"
  }
];

module.exports = citas;