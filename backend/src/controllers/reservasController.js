const reservasService = require('../services/reservasService');

const getReservas = async (req, res, next) => {
  try {
    const result = await reservasService.getReservas(req.dbUser, req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const getReservaById = async (req, res, next) => {
  try {
    const reserva = await reservasService.getReservaById(req.params.id, req.dbUser);
    res.json(reserva);
  } catch (err) {
    next(err);
  }
};

const getReservaHistorial = async (req, res, next) => {
  try {
    const historial = await reservasService.getReservaHistorial(req.params.id, req.dbUser);
    res.json(historial);
  } catch (err) {
    next(err);
  }
};

const crearReserva = async (req, res, next) => {
  try {
    const nuevaReserva = await reservasService.crearReserva(req.body, req.dbUser);
    res.status(201).json(nuevaReserva);
  } catch (err) {
    next(err);
  }
};

const editarReserva = async (req, res, next) => {
  try {
    const reserva = await reservasService.editarReserva(req.params.id, req.body, req.dbUser);
    res.json(reserva);
  } catch (err) {
    next(err);
  }
};

const aprobarReserva = async (req, res, next) => {
  try {
    const reserva = await reservasService.aprobarReserva(req.params.id, req.dbUser);
    res.json(reserva);
  } catch (err) {
    next(err);
  }
};

const rechazarReserva = async (req, res, next) => {
  try {
    const reserva = await reservasService.rechazarReserva(req.params.id, req.dbUser);
    res.json(reserva);
  } catch (err) {
    next(err);
  }
};

const cancelarReserva = async (req, res, next) => {
  try {
    const reserva = await reservasService.cancelarReserva(req.params.id, req.dbUser);
    res.json(reserva);
  } catch (err) {
    next(err);
  }
};

const getResumen = async (req, res, next) => {
  try {
    const resumen = await reservasService.getResumen();
    res.json(resumen);
  } catch (err) {
    next(err);
  }
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
