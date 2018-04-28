'use strict';

// Use local.env.js for environment variables that will be set when the server starts locally.
// Use for your api keys, secrets, etc. This file should not be tracked by git.
//
// You will need to set these on the server you deploy to.

module.exports = {
  DOMAIN: 'http://localhost:9000',
  SESSION_SECRET: 'fbdox-secret',
  // Control debug level for modules using visionmedia/debug
  DEBUG: '',

  GMAIL_USER: '',
  GMAIL_PASS: '',
  NODE_ICU_DATA: '/Users/dat/.npm-global/lib/node_modules/full-icu'
};
