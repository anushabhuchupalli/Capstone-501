'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Remove the "chess" game from the "sports" table
    await queryInterface.bulkDelete('Sports', { name: 'chess' });
  },

  down: async (queryInterface, Sequelize) => {
    // If you ever need to rollback this migration, you can add code here
    // For example, if you want to re-add the "chess" game to the "sports" table
    // You would write code similar to what you did in the "up" function
  }
};
