const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Reserva = sequelize.define('Reserva', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  aulaId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'aulas',
      key: 'id'
    }
  },
  usuarioId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'usuarios',
      key: 'id'
    }
  },
  fecha: {
    type: DataTypes.STRING, // YYYY-MM-DD
    allowNull: false
  },
  horaInicio: {
    type: DataTypes.STRING, // HH:mm
    allowNull: false
  },
  horaFin: {
    type: DataTypes.STRING, // HH:mm
    allowNull: false
  },
  cantidadPersonas: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  motivo: {
    type: DataTypes.STRING,
    allowNull: false
  },
  estado: {
    type: DataTypes.STRING, // 'pendiente', 'aprobada', 'cancelada', 'rechazada'
    allowNull: false,
    defaultValue: 'pendiente'
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'reservas',
  timestamps: true,
  updatedAt: false // Solamente necesitamos createdAt según el enunciado
});

module.exports = Reserva;
