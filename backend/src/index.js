const express = require('express');
const cors = require('cors');
const { sequelize, seedDatabase } = require('./models');
const aulasRoutes = require('./routes/aulas.routes');
const reservasRoutes = require('./routes/reservas.routes');
const authRoutes = require('./routes/auth.routes');
const errorHandler = require('./middlewares/error');

require('dotenv').config();

const app = express();

const corsOptions = {
  origin: true,
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));  // Habilita CORS para todas las rutas

// Middleware para parsear el cuerpo de las solicitudes JSON
app.use(express.json());

// Configuración de Sequelize y datos semilla
if (process.env.NODE_ENV !== 'test') {
    sequelize.sync({ force: false })
        .then(async () => {
            console.log('Database synced successfully');
            await seedDatabase();
        })
        .catch(err => console.error('Database sync failed:', err));
} else {
    console.log('Test environment detected - skipping auto DB sync and seed');
}

// Configuración de las rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/aulas', aulasRoutes);
app.use('/api/reservas', reservasRoutes);

// Middleware de manejo centralizado de errores
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

module.exports = app;
