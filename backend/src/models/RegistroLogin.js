const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RegistroLogin = sequelize.define('RegistroLogin', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fecha: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  exitoso: {
    type: DataTypes.BOOLEAN,
    allowNull: false
  },
  ip: {
    type: DataTypes.STRING,
    allowNull: true
  },
  userAgent: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'registros_login',
  timestamps: false
});

module.exports = RegistroLogin;
