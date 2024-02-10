'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Update the password for the admin named 'anusha' with the password '98765'
    await queryInterface.sequelize.query(`
      UPDATE "Admins" 
      SET "password" = '98765' 
      WHERE "username" = 'anusha';
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Revert logic, if needed
  }
};
0