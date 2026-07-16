const db = require('aa-sqlite');
const path = require('path');

const databasePath = process.env.base || process.env.BASE || path.join(__dirname, 'db.sqlite');

async function CrearBaseSiNoExiste() {
  await db.open(databasePath);

  // Limpiar tablas heredadas de proyectos anteriores
  await db.run('DROP TABLE IF EXISTS productos;');
  await db.run('DROP TABLE IF EXISTS Products;');

  // Crear tablas del dominio de reservas de aulas
  await db.run(`CREATE TABLE IF NOT EXISTS usuarios (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    email TEXT,
    passwordHash TEXT,
    rol TEXT NOT NULL DEFAULT 'usuario',
    activo INTEGER NOT NULL DEFAULT 1
  );`);

  await db.run(`CREATE TABLE IF NOT EXISTS aulas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    ubicacion TEXT NOT NULL,
    capacidad INTEGER NOT NULL,
    recursos TEXT,
    activa INTEGER NOT NULL DEFAULT 1
  );`);

  await db.run(`CREATE TABLE IF NOT EXISTS reservas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    aulaId INTEGER NOT NULL,
    usuarioId TEXT NOT NULL,
    fecha TEXT NOT NULL,
    horaInicio TEXT NOT NULL,
    horaFin TEXT NOT NULL,
    cantidadPersonas INTEGER NOT NULL,
    motivo TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'pendiente',
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (aulaId) REFERENCES aulas(id),
    FOREIGN KEY (usuarioId) REFERENCES usuarios(id)
  );`);

  await db.run(`CREATE TABLE IF NOT EXISTS historial_reservas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reservaId INTEGER NOT NULL,
    usuarioId TEXT NOT NULL,
    accion TEXT NOT NULL,
    fechaHora TEXT NOT NULL DEFAULT (datetime('now')),
    valorAnterior TEXT,
    valorNuevo TEXT,
    FOREIGN KEY (reservaId) REFERENCES reservas(id),
    FOREIGN KEY (usuarioId) REFERENCES usuarios(id)
  );`);

  const aulaCount = await db.get('SELECT COUNT(*) AS count FROM aulas');
  if (Number(aulaCount.count) === 0) {
    await db.run(`INSERT INTO aulas (nombre, ubicacion, capacidad, recursos, activa) VALUES
      ('Aula 101', 'Planta Baja - Block A', 30, '["Pizarra","Proyector"]', 1),
      ('Aula 102', 'Planta Baja - Block A', 25, '["Pizarra","Aire Acondicionado"]', 1),
      ('Aula 201', 'Primer Piso - Block B', 50, '["Pizarra","Proyector","Computadoras"]', 1),
      ('Aula 202', 'Primer Piso - Block B', 40, '["Pizarra","Proyector","Aire Acondicionado"]', 1),
      ('Auditorio', 'Planta Baja - Central', 100, '["Proyector","Sonido","Luces","Climatización"]', 1);
    `);
  }

  const usuarioCount = await db.get('SELECT COUNT(*) AS count FROM usuarios');
  if (Number(usuarioCount.count) === 0) {
    await db.run(`INSERT INTO usuarios (id, nombre, email, rol, activo) VALUES
      ('user-id-comun-1', 'Juan Perez', 'juan.perez@example.com', 'usuario', 1),
      ('user-id-comun-2', 'Maria Gomez', 'maria.gomez@example.com', 'usuario', 1),
      ('admin-id-1', 'Admin Master', 'admin@example.com', 'admin', 1);
    `);
  }

  const reservaCount = await db.get('SELECT COUNT(*) AS count FROM reservas');
  if (Number(reservaCount.count) === 0) {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    await db.run(`INSERT INTO reservas (aulaId, usuarioId, fecha, horaInicio, horaFin, cantidadPersonas, motivo, estado, createdAt) VALUES
      (1, 'user-id-comun-1', '${today}', '09:00', '11:00', 15, 'Clase de Álgebra', 'aprobada', datetime('now')),
      (2, 'user-id-comun-2', '${today}', '14:00', '16:00', 20, 'Clase de Análisis Matemático', 'pendiente', datetime('now')),
      (3, 'user-id-comun-1', '${today}', '10:00', '12:00', 45, 'Laboratorio de Programación', 'pendiente', datetime('now')),
      (4, 'user-id-comun-2', '${today}', '18:00', '20:00', 30, 'Reunión de Cátedra', 'rechazada', datetime('now')),
      (5, 'user-id-comun-1', '${tomorrow}', '09:00', '12:00', 80, 'Charla sobre Inteligencia Artificial', 'cancelada', datetime('now')),
      (1, 'user-id-comun-2', '${tomorrow}', '14:00', '16:00', 25, 'Examen de Física', 'aprobada', datetime('now')),
      (2, 'user-id-comun-1', '${tomorrow}', '16:30', '18:30', 10, 'Consulta de Trabajo Final Integrador', 'pendiente', datetime('now')),
      (3, 'admin-id-1', '${tomorrow}', '08:00', '10:00', 15, 'Capacitación Docente sobre Aula Virtual', 'pendiente', datetime('now')),
      (4, 'user-id-comun-2', '${tomorrow}', '11:00', '13:00', 35, 'Clase Práctica de Redes de Información', 'aprobada', datetime('now')),
      (5, 'user-id-comun-1', '${today}', '18:00', '21:00', 50, 'Seminario de Diseño de Sistemas', 'pendiente', datetime('now'));
    `);
  }

  const historialCount = await db.get('SELECT COUNT(*) AS count FROM historial_reservas');
  if (Number(historialCount.count) === 0) {
    await db.run(`INSERT INTO historial_reservas (reservaId, usuarioId, accion, valorAnterior, valorNuevo) VALUES
      (1, 'user-id-comun-1', 'creacion', NULL, '{"id":1,"aulaId":1,"usuarioId":"user-id-comun-1","fecha":"${today}","horaInicio":"09:00","horaFin":"11:00","cantidadPersonas":15,"motivo":"Clase de Álgebra","estado":"aprobada","createdAt":"${new Date().toISOString()}"}'),
      (2, 'user-id-comun-2', 'creacion', NULL, '{"id":2,"aulaId":2,"usuarioId":"user-id-comun-2","fecha":"${today}","horaInicio":"14:00","horaFin":"16:00","cantidadPersonas":20,"motivo":"Clase de Análisis Matemático","estado":"pendiente","createdAt":"${new Date().toISOString()}"}'),
      (3, 'user-id-comun-1', 'creacion', NULL, '{"id":3,"aulaId":3,"usuarioId":"user-id-comun-1","fecha":"${today}","horaInicio":"10:00","horaFin":"12:00","cantidadPersonas":45,"motivo":"Laboratorio de Programación","estado":"pendiente","createdAt":"${new Date().toISOString()}"}');
    `);
  }
  
  await db.close();
}

// Export function but do NOT auto-execute to avoid concurrent writes with Sequelize
module.exports = CrearBaseSiNoExiste;
