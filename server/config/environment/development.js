'use strict';
/*eslint no-process-env:0*/

// Development specific configuration
// ==================================
module.exports = {

  // MongoDB connection options
  mongo: {
    uri: 'mongodb://localhost/fbdox'
  },

  // Seed database on startup
  seedDB: false,
  GOOGLE_TRANSLATE_PROJECT_ID: 'erudite-variety-188516'
};
