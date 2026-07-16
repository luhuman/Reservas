const sequelize = require('../config/database');
const Usuario = require('./Usuario');
const Aula = require('./Aula');
const Reserva = require('./Reserva');
const HistorialReserva = require('./HistorialReserva');
const RegistroLogin = require('./RegistroLogin');
const bcrypt = require('bcrypt');

// Asociaciones
Reserva.belongsTo(Aula, { foreignKey: 'aulaId', as: 'aula' });
Reserva.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'usuario' });

Aula.hasMany(Reserva, { foreignKey: 'aulaId', as: 'reservas' });
Usuario.hasMany(Reserva, { foreignKey: 'usuarioId', as: 'reservas' });

HistorialReserva.belongsTo(Reserva, { foreignKey: 'reservaId', as: 'reserva' });
HistorialReserva.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'usuario' });
Reserva.hasMany(HistorialReserva, { foreignKey: 'reservaId', as: 'historial' });

RegistroLogin.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'usuario', allowNull: true });
Usuario.hasMany(RegistroLogin, { foreignKey: 'usuarioId', as: 'registrosLogin' });

// Función para insertar datos semilla (Seeders)
const seedDatabase = async () => {
  try {
    const aulaCount = await Aula.count();
    if (aulaCount === 0) {
      // Insertar al menos 5 aulas
      await Aula.bulkCreate([
        { nombre: 'Aula 101', ubicacion: 'Planta Baja - Block A', capacidad: 30, recursos: ['Pizarra', 'Proyector'], activa: true },
        { nombre: 'Aula 102', ubicacion: 'Planta Baja - Block A', capacidad: 25, recursos: ['Pizarra', 'Aire Acondicionado'], activa: true },
        { nombre: 'Aula 201', ubicacion: 'Primer Piso - Block B', capacidad: 50, recursos: ['Pizarra', 'Proyector', 'Computadoras'], activa: true },
        { nombre: 'Aula 202', ubicacion: 'Primer Piso - Block B', capacidad: 40, recursos: ['Pizarra', 'Proyector', 'Aire Acondicionado'], activa: true },
        { nombre: 'Auditorio', ubicacion: 'Planta Baja - Central', capacidad: 100, recursos: ['Proyector', 'Sonido', 'Luces', 'Climatización'], activa: true }
      ]);
      console.log('--- Aulas iniciales insertadas ---');
    }

    const userCount = await Usuario.count();
    if (userCount === 0) {
      // Generar hash para la contraseña semilla: lector123
      const hashedPassword = await bcrypt.hash('lector123', 10);
      // Insertar al menos 2 usuarios comunes y 1 administrador
      await Usuario.bulkCreate([
        { id: 'user-id-comun-1', nombre: 'Juan Perez', email: 'juan.perez@example.com', rol: 'usuario', activo: true, passwordHash: hashedPassword },
        { id: 'user-id-comun-2', nombre: 'Maria Gomez', email: 'maria.gomez@example.com', rol: 'usuario', activo: true, passwordHash: hashedPassword },
        { id: 'admin-id-1', nombre: 'Admin Master', email: 'admin@example.com', rol: 'admin', activo: true, passwordHash: hashedPassword }
      ]);
      console.log('--- Usuarios iniciales insertados ---');
    }

    const reservaCount = await Reserva.count();
    if (reservaCount === 0) {
      const aulas = await Aula.findAll();
      const users = await Usuario.findAll();
      
      const adminUser = users.find(u => u.rol === 'admin');
      const normalUsers = users.filter(u => u.rol === 'usuario');

      const todayStr = new Date().toISOString().split('T')[0];
      const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

      // Insertar al menos 10 reservas de prueba
      const reservations = [
        {
          aulaId: aulas[0].id,
          usuarioId: normalUsers[0].id,
          fecha: todayStr,
          horaInicio: '09:00',
          horaFin: '11:00',
          cantidadPersonas: 15,
          motivo: 'Clase de Álgebra',
          estado: 'aprobada'
        },
        {
          aulaId: aulas[1].id,
          usuarioId: normalUsers[1].id,
          fecha: todayStr,
          horaInicio: '14:00',
          horaFin: '16:00',
          cantidadPersonas: 20,
          motivo: 'Clase de Análisis Matemático',
          estado: 'pendiente'
        },
        {
          aulaId: aulas[2].id,
          usuarioId: normalUsers[0].id,
          fecha: todayStr,
          horaInicio: '10:00',
          horaFin: '12:00',
          cantidadPersonas: 45,
          motivo: 'Laboratorio de Programación',
          estado: 'pendiente'
        },
        {
          aulaId: aulas[3].id,
          usuarioId: normalUsers[1].id,
          fecha: todayStr,
          horaInicio: '18:00',
          horaFin: '20:00',
          cantidadPersonas: 30,
          motivo: 'Reunión de Cátedra',
          estado: 'rechazada'
        },
        {
          aulaId: aulas[4].id,
          usuarioId: normalUsers[0].id,
          fecha: tomorrowStr,
          horaInicio: '09:00',
          horaFin: '12:00',
          cantidadPersonas: 80,
          motivo: 'Charla sobre Inteligencia Artificial',
          estado: 'cancelada'
        },
        {
          aulaId: aulas[0].id,
          usuarioId: normalUsers[1].id,
          fecha: tomorrowStr,
          horaInicio: '14:00',
          horaFin: '16:00',
          cantidadPersonas: 25,
          motivo: 'Examen de Física',
          estado: 'aprobada'
        },
        {
          aulaId: aulas[1].id,
          usuarioId: normalUsers[0].id,
          fecha: tomorrowStr,
          horaInicio: '16:30',
          horaFin: '18:30',
          cantidadPersonas: 10,
          motivo: 'Consulta de Trabajo Final Integrador',
          estado: 'pendiente'
        },
        {
          aulaId: aulas[2].id,
          usuarioId: adminUser.id,
          fecha: tomorrowStr,
          horaInicio: '08:00',
          horaFin: '10:00',
          cantidadPersonas: 15,
          motivo: 'Capacitación Docente sobre Aula Virtual',
          estado: 'pendiente'
        },
        {
          aulaId: aulas[3].id,
          usuarioId: normalUsers[1].id,
          fecha: tomorrowStr,
          horaInicio: '11:00',
          horaFin: '13:00',
          cantidadPersonas: 35,
          motivo: 'Clase Práctica de Redes de Información',
          estado: 'aprobada'
        },
        // (Se removió una reserva extra para dejar exactamente 10 reservas semilla)
      ];

      const createdReservations = await Reserva.bulkCreate(reservations);

      // Crear el historial de auditoría de creación para cada reserva
      for (const res of createdReservations) {
        await HistorialReserva.create({
          reservaId: res.id,
          usuarioId: res.usuarioId,
          accion: 'creacion',
          valorAnterior: null,
          valorNuevo: res.toJSON()
        });
      }
      console.log('--- Reservas iniciales e historial auditados e insertados ---');
    }
  } catch (err) {
    console.error('Error al insertar datos semilla:', err);
  }
};

module.exports = {
  sequelize,
  Usuario,
  Aula,
  Reserva,
  HistorialReserva,
  RegistroLogin,
  seedDatabase
};
