const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Usuario, RegistroLogin } = require('../models');

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  const { email, password } = req.body;
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son requeridos' });
  }

  try {
    // Buscar usuario por email (incluyendo passwordHash que está excluido por defecto)
    const user = await Usuario.scope('withPassword').findOne({ where: { email } });

    let exitoso = false;
    let usuarioId = null;

    if (user) {
      usuarioId = user.id;
      // Verificar contraseña
      exitoso = await bcrypt.compare(password, user.passwordHash);
    }

    // Registrar en la base de datos
    await RegistroLogin.create({
      email,
      usuarioId,
      exitoso,
      ip,
      userAgent
    });

    if (!user || !exitoso) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    if (!user.activo) {
      return res.status(403).json({ error: 'Usuario inactivo' });
    }

    // Generar Token JWT
    const secret = process.env.JWT_SECRET || 'super-secret-key-123';
    const token = jwt.sign({
      sub: user.id,
      name: user.nombre,
      email: user.email,
      realm_access: {
        roles: [user.rol]
      }
    }, secret, { expiresIn: '8h' });

    res.json({
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
