const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const HistorialReserva = sequelize.define('HistorialReserva', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  reservaId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'reservas',
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
  accion: {
    type: DataTypes.STRING, // 'creacion', 'edicion', 'aprobacion', 'rechazo', 'cancelacion'
    allowNull: false
  },
  fechaHora: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  valorAnterior: {
    type: DataTypes.JSON, // Almacena el objeto del estado anterior
    allowNull: true
  },
  valorNuevo: {
    type: DataTypes.JSON, // Almacena el objeto del nuevo estado
    allowNull: true
  }
}, {
  tableName: 'historial_reservas',
  timestamps: false
});

module.exports = HistorialReserva;
