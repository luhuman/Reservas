const express = require('express');
const router = express.Router();
const reservasController = require('../controllers/reservasController');
const { authenticateJWT, extractUser, authorizeRoles } = require('../middlewares/auth');

// Todas las rutas de reservas requieren autenticación de JWT y sincronización de usuario
router.use(authenticateJWT, extractUser);

// Obtener todas las reservas (con soporte de filtros y paginación)
router.get('/', reservasController.getReservas);

// Resumen del panel (solo administradores) - Debe ir antes de /:id para evitar conflictos de ruteo
router.get('/resumen', authorizeRoles('admin'), reservasController.getResumen);

// Obtener detalle de una reserva específica
router.get('/:id', reservasController.getReservaById);

// Obtener el historial de cambios de una reserva
router.get('/:id/historial', reservasController.getReservaHistorial);

// Crear una nueva reserva (solo usuarios regulares)
router.post('/', authorizeRoles('usuario'), reservasController.crearReserva);

// Editar una reserva existente (solo admin)
router.put('/:id', authorizeRoles('admin'), reservasController.editarReserva);

// Aprobación de reserva (solo administradores)
router.patch('/:id/aprobar', authorizeRoles('admin'), reservasController.aprobarReserva);

// Rechazo de reserva (solo administradores)
router.patch('/:id/rechazar', authorizeRoles('admin'), reservasController.rechazarReserva);

// Cancelación de reserva (dueño o administradores)
router.patch('/:id/cancelar', reservasController.cancelarReserva);

module.exports = router;
