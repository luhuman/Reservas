const express = require('express');
const router = express.Router();
const aulasController = require('../controllers/aulasController');
const { authenticateJWT, extractUser } = require('../middlewares/auth');

// Ruta protegida por token JWT
router.get('/', authenticateJWT, extractUser, aulasController.getAulas);

module.exports = router;
