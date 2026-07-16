const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');

// Middleware para validar el token JWT con firma simétrica
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Falta token de autenticación o formato no válido' });
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET || 'super-secret-key-123';

  jwt.verify(token, secret, { algorithms: ['HS256'] }, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Token inválido o expirado' });
    }
    req.user = decoded;
    return next();
  });
};

// Middleware para extraer el usuario y buscarlo en la base de datos local SQLite
const extractUser = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Usuario no autenticado' });
  }

  try {
    const id = req.user.sub;
    const dbUser = await Usuario.findByPk(id);

    if (!dbUser) {
      return res.status(401).json({ error: 'El usuario no existe en la base de datos' });
    }

    if (!dbUser.activo) {
      return res.status(403).json({ error: 'Usuario inactivo' });
    }

    req.dbUser = dbUser;
    next();
  } catch (err) {
    next(err);
  }
};

// Middleware para autorizar roles
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.dbUser) {
      return res.status(401).json({ error: 'No se encontraron datos del usuario autenticado' });
    }

    if (!allowedRoles.includes(req.dbUser.rol)) {
      return res.status(403).json({ error: 'Rol insuficiente para acceder a este recurso' });
    }

    next();
  };
};

module.exports = {
  authenticateJWT,
  extractUser,
  authorizeRoles
};
