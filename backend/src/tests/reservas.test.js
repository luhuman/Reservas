process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';

const request = require('supertest');
const app = require('../index');
const { sequelize, seedDatabase, Reserva, Aula, Usuario, HistorialReserva } = require('../models');
const jwt = require('jsonwebtoken');

const tokenSecret = 'test-secret';
const todayStr = new Date().toISOString().split('T')[0];
const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

// Generar tokens de prueba
const getAdminToken = () => {
  return jwt.sign({
    sub: 'admin-id-1',
    name: 'Admin Master',
    email: 'admin@example.com',
    realm_access: {
      roles: ['admin']
    }
  }, tokenSecret, { algorithm: 'HS256' });
};

const getUserToken = () => {
  return jwt.sign({
    sub: 'user-id-comun-1',
    name: 'Juan Perez',
    email: 'juan.perez@example.com',
    realm_access: {
      roles: ['usuario']
    }
  }, tokenSecret, { algorithm: 'HS256' });
};

const getInvalidToken = () => {
  return jwt.sign({
    sub: 'invalid-user',
    name: 'Fake User',
    email: 'fake@example.com'
  }, 'wrong-secret', { algorithm: 'HS256' });
};

beforeAll(async () => {
  // Sincronizar y limpiar DB
  await sequelize.sync({ force: true });
  await seedDatabase();
});

afterAll(async () => {
  await sequelize.close();
});

describe('Suite de Pruebas - Reserva de Aulas', () => {

  // Caso 1: Login correcto (Simulado/Keycloak token válido)
  test('1. Login correcto (Simulado/Keycloak token válido)', async () => {
    const res = await request(app)
      .get('/api/aulas')
      .set('Authorization', `Bearer ${getUserToken()}`);
    
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  // Caso 2: Login inválido
  test('2. Login con firma de token inválida', async () => {
    const res = await request(app)
      .get('/api/aulas')
      .set('Authorization', `Bearer ${getInvalidToken()}`);
    
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  // Caso 3: Listado sin filtros
  test('3. Listado de reservas sin filtros para usuario regular', async () => {
    const res = await request(app)
      .get('/api/reservas')
      .set('Authorization', `Bearer ${getUserToken()}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('rows');
    expect(res.body).toHaveProperty('count');
    expect(res.body.count).toBe(4);
  });

  // Caso 4: Listado con filtros
  test('4. Listado de reservas filtrando por estado aprobada', async () => {
    const res = await request(app)
      .get('/api/reservas?estado=aprobada')
      .set('Authorization', `Bearer ${getUserToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.rows.every(r => r.estado === 'aprobada')).toBe(true);
  });

  // Caso 5: Detalle existente
  test('5. Detalle de una reserva existente', async () => {
    const res = await request(app)
      .get('/api/reservas/1')
      .set('Authorization', `Bearer ${getUserToken()}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', 1);
    expect(res.body).toHaveProperty('aula');
    expect(res.body).toHaveProperty('usuario');
  });

  // Caso 6: Detalle inexistente
  test('6. Detalle de una reserva inexistente', async () => {
    const res = await request(app)
      .get('/api/reservas/999')
      .set('Authorization', `Bearer ${getUserToken()}`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  // Caso 7: Creación válida
  test('7. Creación de una reserva válida', async () => {
    const nuevaReserva = {
      aulaId: 1,
      fecha: tomorrowStr,
      horaInicio: '12:00',
      horaFin: '13:00',
      cantidadPersonas: 10,
      motivo: 'Clase de Álgebra Avanzada'
    };

    const res = await request(app)
      .post('/api/reservas')
      .set('Authorization', `Bearer ${getUserToken()}`)
      .send(nuevaReserva);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.estado).toBe('pendiente');

    // Verificar que se auditó en el historial
    const historialRes = await request(app)
      .get(`/api/reservas/${res.body.id}/historial`)
      .set('Authorization', `Bearer ${getUserToken()}`);

    expect(historialRes.status).toBe(200);
    expect(historialRes.body.length).toBe(1);
    expect(historialRes.body[0].accion).toBe('creacion');
  });

  // Caso 8: Capacidad insuficiente
  test('8. Error al crear por capacidad del aula insuficiente', async () => {
    const reservaInvalida = {
      aulaId: 1, // Capacidad es 30
      fecha: tomorrowStr,
      horaInicio: '14:00',
      horaFin: '15:00',
      cantidadPersonas: 50, // Excede capacidad
      motivo: 'Evento multitudinario'
    };

    const res = await request(app)
      .post('/api/reservas')
      .set('Authorization', `Bearer ${getUserToken()}`)
      .send(reservaInvalida);

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('excede la capacidad máxima');
  });

  // Caso 9: Superposición horaria
  test('9. Error al crear por superposición horaria', async () => {
    // La reserva #1 ya existe y está aprobada para hoy (09:00 - 11:00) en aula 1
    const reservaSolapada = {
      aulaId: 1,
      fecha: todayStr,
      horaInicio: '10:00', // Solapamiento
      horaFin: '12:00',
      cantidadPersonas: 15,
      motivo: 'Consulta de Sistemas'
    };

    const res = await request(app)
      .post('/api/reservas')
      .set('Authorization', `Bearer ${getUserToken()}`)
      .send(reservaSolapada);

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('superposición horaria');
  });

  // Caso 10: Acceso sin JWT (401)
  test('10. Acceso a recursos sin token JWT', async () => {
    const res = await request(app)
      .get('/api/reservas');

    expect(res.status).toBe(401);
    expect(res.body.error).toContain('Falta token');
  });

  // Caso 11: Acceso con rol insuficiente (403)
  test('11. Acceso a dashboard administrativo con rol insuficiente', async () => {
    const res = await request(app)
      .get('/api/reservas/resumen')
      .set('Authorization', `Bearer ${getUserToken()}`); // Rol usuario

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Rol insuficiente');
  });

  // Caso 12: Edición con conflicto horaria
  test('12. Edición con conflicto horaria (solapamiento)', async () => {
    // Intentamos editar la reserva #2 (que está en Aula 2, pendiente) para que se mude
    // al Aula 1, hoy, de 10:00 a 11:00. Chocará con la reserva #1 (Aula 1, aprobada, 09:00-11:00).
    const edicionInvalida = {
      aulaId: 1, // Aula 1
      fecha: todayStr,
      horaInicio: '10:00', // Choca
      horaFin: '11:00',
      cantidadPersonas: 10,
      motivo: 'Clase movida de aula'
    };

    const res = await request(app)
      .put('/api/reservas/2')
      .set('Authorization', `Bearer ${getAdminToken()}`)
      .send(edicionInvalida);

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('superposición horaria');
  });

  // Caso 13: Cambio de estado inválido
  test('13. Cambio de estado inválido (desde estado final)', async () => {
    // La reserva #4 está rechazada de forma predeterminada (estado final)
    // Intentar aprobar una reserva rechazada debe lanzar un error 400
    const res = await request(app)
      .patch('/api/reservas/4/aprobar')
      .set('Authorization', `Bearer ${getAdminToken()}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Transición inválida');
  });

});
