const { Aula } = require('../models');

// Obtener todas las aulas activas
const getAulas = async (req, res, next) => {
  try {
    const aulas = await Aula.findAll({
      where: { activa: true },
      order: [['nombre', 'ASC']]
    });
    res.json(aulas);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAulas
};
