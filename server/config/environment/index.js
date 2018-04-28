'use strict';
/*eslint no-process-env:0*/

import path from 'path';
import _ from 'lodash';

const rootDir = process.env.NODE_ENV === 'production' ? path.normalize(`${__dirname}/../../../..`) : path.normalize(`${__dirname}/../../..`);

/*function requiredProcessEnv(name) {
  if(!process.env[name]) {
    throw new Error('You must set the ' + name + ' environment variable');
  }
  return process.env[name];
}*/

// All configurations will extend these options
// ============================================
const all = {
  env: process.env.NODE_ENV,

  // Root path of server
  root: path.normalize(`${__dirname}/../../..`),

  // Browser-sync port
  browserSyncPort: process.env.BROWSER_SYNC_PORT || 3000,

  // Server port
  port: process.env.PORT || 9000,

  // Server IP
  ip: process.env.IP || '0.0.0.0',

  // Should we populate the DB with sample data?
  seedDB: false,

  // Secret for session, you will want to change this and make it an environment variable
  secrets: {
    session: process.env.SESSION_SECRET || 'shhhhhhared-secret',
  },

  // MongoDB connection options
  mongo: {
    options: {
      db: {
        safe: true
      }
    }
  },

  uploads: {
    dir: path.resolve(rootDir, 'products/assets/uploads/'),
    parent: path.resolve(rootDir, 'products/assets/')
  },

  mail: {
    defaults: {
      from: 'fbdox@service.com',
      subject: 'Your generated documents',
    }
  },

  mailer: {
    service: 'Gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    }
  },
  // Stripe
  stripe: {
    secretKey: 'sk_test_W2eMUcBo0oWQVb5nmEf5y2qY',
    endpointSecret: 'whsec_nf9TXBK4eojQtEQ3Iq7NIV710SOvdslg'
  }
};

// Export the config object based on the NODE_ENV
// ==============================================
module.exports = _.merge(
  all,
  require('./shared'),
  require(`./${process.env.NODE_ENV}.js`) || {});
