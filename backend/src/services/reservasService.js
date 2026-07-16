const { Reserva, Aula, Usuario, HistorialReserva, sequelize } = require('../models');
const { Op } = require('sequelize');

const buildQueryFilters = (query) => {
  const where = {};

  if (query.fecha) {
    where.fecha = query.fecha;
  }
  if (query.estado) {
    where.estado = query.estado;
  }
  if (query.aulaId) {
    where.aulaId = query.aulaId;
  }
  if (query.motivo) {
    where.motivo = { [Op.like]: `%${query.motivo}%` };
  }

  return where;
};

const getReservas = async (dbUser, query) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 10;
  const sortBy = query.sortBy || 'createdAt';
  const order = query.order || 'DESC';
  const offset = (page - 1) * limit;

  const where = buildQueryFilters(query);

  if (dbUser.rol !== 'admin') {
    where.usuarioId = dbUser.id;
  }

  const { rows, count } = await Reserva.findAndCountAll({
    where,
    limit,
    offset,
    order: [[sortBy, order]],
    include: [
      { model: Aula, as: 'aula' },
      { model: Usuario, as: 'usuario' }
    ]
  });

  return {
    rows,
    count,
    page,
    limit,
    totalPages: Math.ceil(count / limit)
  };
};

const getReservaById = async (id, dbUser) => {
  const reserva = await Reserva.findByPk(id, {
    include: [
      { model: Aula, as: 'aula' },
      { model: Usuario, as: 'usuario' }
    ]
  });

  if (!reserva) {
    const error = new Error('Reserva no encontrada');
    error.status = 404;
    throw error;
  }

  if (dbUser.rol !== 'admin' && reserva.usuarioId !== dbUser.id) {
    const error = new Error('No tienes permisos para acceder a esta reserva');
    error.status = 403;
    throw error;
  }

  return reserva;
};

const getReservaHistorial = async (id, dbUser) => {
  const reserva = await Reserva.findByPk(id);
  if (!reserva) {
    const error = new Error('Reserva no encontrada');
    error.status = 404;
    throw error;
  }

  if (dbUser.rol !== 'admin' && reserva.usuarioId !== dbUser.id) {
    const error = new Error('No tienes permisos para acceder al historial de esta reserva');
    error.status = 403;
    throw error;
  }

  const historial = await HistorialReserva.findAll({
    where: { reservaId: id },
    order: [['fechaHora', 'DESC']],
    include: [
      { model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'email', 'rol'] }
    ]
  });

  return historial;
};

const checkTimeOverlap = async (aulaId, fecha, horaInicio, horaFin, ignoreReservaId = null) => {
  const whereClause = {
    aulaId,
    fecha,
    estado: { [Op.in]: ['pendiente', 'aprobada'] },
    [Op.and]: [
      { horaInicio: { [Op.lt]: horaFin } },
      { horaFin: { [Op.gt]: horaInicio } }
    ]
  };

  if (ignoreReservaId) {
    whereClause.id = { [Op.ne]: ignoreReservaId };
  }

  return Reserva.findOne({ where: whereClause });
};

const validarReservaPayload = async ({ aulaId, fecha, horaInicio, horaFin, cantidadPersonas }, usuarioId, ignoreReservaId = null) => {
  if (!aulaId || !fecha || !horaInicio || !horaFin || cantidadPersonas === undefined) {
    const error = new Error('Faltan datos obligatorios para crear o editar la reserva');
    error.status = 400;
    throw error;
  }

  if (horaInicio >= horaFin) {
    const error = new Error('La hora de inicio debe ser anterior a la de fin');
    error.status = 400;
    throw error;
  }

  if (horaInicio < '08:00' || horaFin > '22:00') {
    const error = new Error('Las reservas deben realizarse dentro del horario laboral (08:00 a 22:00)');
    error.status = 400;
    throw error;
  }

  const aula = await Aula.findByPk(aulaId);
  if (!aula) {
    const error = new Error('El aula seleccionada no existe');
    error.status = 400;
    throw error;
  }

  if (!aula.activa) {
    const error = new Error('El aula seleccionada no se encuentra activa');
    error.status = 400;
    throw error;
  }

  if (cantidadPersonas <= 0) {
    const error = new Error('La cantidad de personas debe ser mayor a 0');
    error.status = 400;
    throw error;
  }

  if (cantidadPersonas > aula.capacidad) {
    const error = new Error(`La cantidad de personas (${cantidadPersonas}) excede la capacidad máxima del aula (${aula.capacidad})`);
    error.status = 400;
    throw error;
  }

  const overlap = await checkTimeOverlap(aulaId, fecha, horaInicio, horaFin, ignoreReservaId);
  if (overlap) {
    const error = new Error('Existe una superposición horaria con otra reserva pendiente o aprobada');
    error.status = 400;
    throw error;
  }

  return aula;
};

const crearReserva = async (payload, dbUser) => {
  const usuarioId = dbUser.id;

  await validarReservaPayload(payload, usuarioId);

  const nuevaReserva = await Reserva.create({
    aulaId: payload.aulaId,
    usuarioId,
    fecha: payload.fecha,
    horaInicio: payload.horaInicio,
    horaFin: payload.horaFin,
    cantidadPersonas: payload.cantidadPersonas,
    motivo: payload.motivo,
    estado: 'pendiente'
  });

  await HistorialReserva.create({
    reservaId: nuevaReserva.id,
    usuarioId,
    accion: 'creacion',
    valorAnterior: null,
    valorNuevo: nuevaReserva.toJSON()
  });

  return nuevaReserva;
};

const editarReserva = async (id, payload, dbUser) => {
  const reserva = await Reserva.findByPk(id);
  if (!reserva) {
    const error = new Error('Reserva no encontrada');
    error.status = 404;
    throw error;
  }

  if (reserva.estado === 'cancelada' || reserva.estado === 'rechazada') {
    const error = new Error('No se pueden modificar reservas que ya fueron canceladas o rechazadas');
    error.status = 400;
    throw error;
  }

  if (dbUser.rol !== 'admin' && reserva.usuarioId !== dbUser.id) {
    const error = new Error('No tienes permisos para editar esta reserva');
    error.status = 403;
    throw error;
  }

  await validarReservaPayload(payload, dbUser.id, reserva.id);

  const valorAnterior = reserva.toJSON();
  reserva.aulaId = payload.aulaId;
  reserva.fecha = payload.fecha;
  reserva.horaInicio = payload.horaInicio;
  reserva.horaFin = payload.horaFin;
  reserva.cantidadPersonas = payload.cantidadPersonas;
  reserva.motivo = payload.motivo;

  await reserva.save();

  await HistorialReserva.create({
    reservaId: reserva.id,
    usuarioId: dbUser.id,
    accion: 'edicion',
    valorAnterior,
    valorNuevo: reserva.toJSON()
  });

  return reserva;
};

const aprobarReserva = async (id, dbUser) => {
  const reserva = await Reserva.findByPk(id);
  if (!reserva) {
    const error = new Error('Reserva no encontrada');
    error.status = 404;
    throw error;
  }

  if (reserva.estado !== 'pendiente') {
    const error = new Error(`Transición inválida: no se puede aprobar una reserva en estado ${reserva.estado}`);
    error.status = 400;
    throw error;
  }

  const valorAnterior = reserva.toJSON();
  reserva.estado = 'aprobada';
  await reserva.save();

  await HistorialReserva.create({
    reservaId: reserva.id,
    usuarioId: dbUser.id,
    accion: 'aprobacion',
    valorAnterior,
    valorNuevo: reserva.toJSON()
  });

  return reserva;
};

const rechazarReserva = async (id, dbUser) => {
  const reserva = await Reserva.findByPk(id);
  if (!reserva) {
    const error = new Error('Reserva no encontrada');
    error.status = 404;
    throw error;
  }

  if (reserva.estado !== 'pendiente') {
    const error = new Error(`Transición inválida: no se puede rechazar una reserva en estado ${reserva.estado}`);
    error.status = 400;
    throw error;
  }

  const valorAnterior = reserva.toJSON();
  reserva.estado = 'rechazada';
  await reserva.save();

  await HistorialReserva.create({
    reservaId: reserva.id,
    usuarioId: dbUser.id,
    accion: 'rechazo',
    valorAnterior,
    valorNuevo: reserva.toJSON()
  });

  return reserva;
};

const cancelarReserva = async (id, dbUser) => {
  const reserva = await Reserva.findByPk(id);
  if (!reserva) {
    const error = new Error('Reserva no encontrada');
    error.status = 404;
    throw error;
  }

  if (dbUser.rol !== 'admin' && reserva.usuarioId !== dbUser.id) {
    const error = new Error('No tienes permisos para cancelar esta reserva');
    error.status = 403;
    throw error;
  }

  if (reserva.estado !== 'pendiente' && reserva.estado !== 'aprobada') {
    const error = new Error(`Transición inválida: no se puede cancelar una reserva en estado ${reserva.estado}`);
    error.status = 400;
    throw error;
  }

  const valorAnterior = reserva.toJSON();
  reserva.estado = 'cancelada';
  await reserva.save();

  await HistorialReserva.create({
    reservaId: reserva.id,
    usuarioId: dbUser.id,
    accion: 'cancelacion',
    valorAnterior,
    valorNuevo: reserva.toJSON()
  });

  return reserva;
};

const getResumen = async () => {
  const todayStr = new Date().toISOString().split('T')[0];

  const statusCounts = await Reserva.findAll({
    attributes: ['estado', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
    group: ['estado']
  });

  const counts = {
    pendiente: 0,
    aprobada: 0,
    cancelada: 0,
    rechazada: 0
  };

  statusCounts.forEach(item => {
    counts[item.estado] = parseInt(item.getDataValue('count'), 10);
  });

  const aulas = await Aula.findAll({
    where: { activa: true },
    include: [{ model: Reserva, as: 'reservas', attributes: ['estado'] }]
  });

  const ocupacion = aulas.map(aula => {
    const reservas = aula.reservas || [];
    const total = reservas.length;
    const aprobadas = reservas.filter(r => r.estado === 'aprobada').length;
    const pendientes = reservas.filter(r => r.estado === 'pendiente').length;

    return {
      aulaId: aula.id,
      nombre: aula.nombre,
      ubicacion: aula.ubicacion,
      capacidad: aula.capacidad,
      totalReservas: total,
      reservasAprobadas: aprobadas,
      reservasPendientes: pendientes
    };
  });

  const proximas = await Reserva.findAll({
    where: {
      fecha: { [Op.gte]: todayStr },
      estado: { [Op.in]: ['pendiente', 'aprobada'] }
    },
    include: [
      { model: Aula, as: 'aula', attributes: ['id', 'nombre', 'ubicacion'] },
      { model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'email'] }
    ],
    order: [['horaInicio', 'ASC']]
  });

  return {
    resumenEstados: counts,
    ocupacionAulas: ocupacion,
    proximasReservas: proximas
  };
};

module.exports = {
  getReservas,
  getReservaById,
  getReservaHistorial,
  crearReserva,
  editarReserva,
  aprobarReserva,
  rechazarReserva,
  cancelarReserva,
  getResumen
};
