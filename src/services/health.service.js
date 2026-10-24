const { sequelize } = require('../models');

async function getHealth() {
  await sequelize.authenticate();

  return {
    status: 'ok',
    database: 'up',
  };
}

module.exports = {
  getHealth,
};