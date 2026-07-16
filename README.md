# DDS - Trabajo Integrador

Resumen del proyecto: aplicación de reservas de aulas (backend en Node.js/Express + Sequelize/SQLite, frontend en React).

## Ejecutar el backend

1. Ir a la carpeta `backend`

```bash
cd backend
npm install
npm start
```

Nota: para ejecución local con tokens de prueba para desarrollo o tests puede setearse `JWT_SECRET`.

## Ejecutar tests

```bash
cd backend
npm test
```

## Usuarios

- Administrador:
  - usuario: `adming41`
  - contraseña: `admin123`
  - rol: `admin`

- Usuario de prueba:
  - usuario: `test11@gmail.com`
  - contraseña: `lector123` 
  - rol: `usuario`

> Para pruebas rápidas con JWT simulado (entorno de test) el proyecto usa `JWT_SECRET=test-secret`.


## Endpoints principales (backend)

- `GET /api/aulas` - Listar aulas
- `GET /api/reservas` - Listar reservas (soporta filtros por query string)
- `GET /api/reservas/:id` - Detalle de reserva
- `POST /api/reservas` - Crear reserva (solo rol `usuario`)
- `PUT /api/reservas/:id` - Editar reserva (solo rol `admin`)
- `PATCH /api/reservas/:id/aprobar` - Aprobar reserva (solo `admin`)
- `PATCH /api/reservas/:id/rechazar` - Rechazar reserva (solo `admin`)
- `PATCH /api/reservas/:id/cancelar` - Cancelar reserva (usuario dueño o `admin`)

### Filtros (query string)

`/api/reservas?estado=aprobada&aulaId=1&motivo=clase&page=1&limit=10&sortBy=createdAt&order=DESC`

## Reglas de negocio (capacidad y superposición)

- Capacidad: al crear o editar una reserva se valida que `cantidadPersonas <= aula.capacidad`. Si excede, la API responde `400` con JSON `{ "error": "La cantidad de personas (X) excede la capacidad máxima del aula (Y)" }`.
- Superposición horaria: no se permiten reservas `pendiente` o `aprobada` que se solapen en la misma `aula` y `fecha`. Al crear/editar se valida y devuelve `400` y un mensaje claro.

## JWT, roles y permisos

- La integración prevista es con Keycloak (OpenID Connect). En producción Keycloak emite JWTs con `sub`, `name`, `email` y roles en `realm_access` o `resource_access`.
- El backend no almacena ni transmite contraseñas en JWT. La contraseña la gestiona Keycloak.
- Roles usados: `admin` y `usuario`.
  - `usuario`: puede crear reservas y ver/editar sus propias reservas (edición limitada según reglas).
  - `admin`: puede ver todas las reservas, aprobar/rechazar/cancelar y editar desde panel administrativo. NO tiene botón para crear reservas (control mostrado en frontend).

## Persistencia y decisiones de diseño

- Base de datos: SQLite para simplicidad y pruebas locales. Sequelize ORM para modelado.
- Estructura de carpetas: `backend/src` contiene `models/`, `controllers/`, `services/`, `routes/`, `middlewares/`, `config/`, `tests/`.
- División de responsabilidades:
  - `controllers/`: manejo de request/response y códigos HTTP.
  - `services/`: lógica de negocio (validaciones de capacidad, superposición, historial).
  - `models/`: definiciones Sequelize y getters/setters para compatibilidad SQLite.

## Comandos útiles

- Iniciar backend en modo normal: `npm start`
- Ejecutar tests del backend: `npm test`
- Borrar y reconstruir DB (en desarrollo) usar scripts de Sequelize o eliminar `backend/db/db.sqlite` y reiniciar.

## Limitaciones conocidas

- SQLite no soporta tipo `ARRAY` nativo; para compatibilidad el campo `Aula.recursos` se almacena internamente como `TEXT` con JSON y el modelo expone un array mediante getters/setters.
- Si se desea migrar a PostgreSQL, se puede cambiar `Aula.recursos` a `DataTypes.ARRAY(DataTypes.STRING)` y ajustar `config/database.js`.

## Seguridad y buenas prácticas

- No incluir contraseñas ni hashes en JWT. Keycloak es responsable del manejo seguro de contraseñas.

## Ejecutar el frontend

Ir a la carpeta `frontend` e instalar dependencias:

```bash
cd frontend
npm install
npm start
```

## Contribuciones (Asignación por integrante)

Se detallan las responsabilidades que cada integrante:

- **411258 Pinciroli Benicio — Backend (Modelos y API):**
  - Archivos principales: `backend/src/models/Usuario.js`, `backend/src/models/Aula.js`, `backend/src/models/Reserva.js`, `backend/src/models/HistorialReserva.js`, `backend/src/models/index.js` (seed), `backend/src/controllers/*`, `backend/src/routes/*`.
  - Responsabilidades: diseño de modelos, asociaciones, seed de datos, endpoints CRUD básicos.

- **96794 Santillan Lautaro — Autenticación y Lógica de Negocio:**
  - Archivos principales: `backend/src/middlewares/auth.js`, `backend/src/services/reservasService.js`, `backend/src/middlewares/error.js`, y controladores relacionados con cambios de estado (`backend/src/controllers/reservasController.js`).
  - Responsabilidades: integración Keycloak/JWT, autorización por roles, validaciones de capacidad y superposición, endpoints de aprobar/rechazar/cancelar.

- **400615 Human Luciana — Frontend y Diseño:**
  - Archivos principales: `frontend/src/components/PublicPage.js`, `frontend/src/components/AppNavbar.js`, `frontend/src/components/Callback.js`, `frontend/src/components/ReservasList.js`, `frontend/src/components/ReservaForm.js`, `frontend/src/components/ReservaDetail.js`, `frontend/src/components/ReservaHistorial.js`, `frontend/src/App.css`.
  - Responsabilidades: interfaces públicas y privadas, manejo de navegación, formularios y estilos (adaptación de la plantilla Creative sin fuentes externas).


