/**
 * Main application file
 */

'use strict';

import express from 'express';
import mongoose from 'mongoose';
import bluebird from 'bluebird';
mongoose.Promise = require('bluebird');
import config from './config/environment';
import http from 'http';
import seedDatabaseIfNeeded from './config/seed';
import cronJobForDeleteGeneralDocument from '../scripts/deleteGeneralDocument';
import stripe from './components/stripe';
import _ from 'lodash';

// Connect to MongoDB
mongoose.connect(config.mongo.uri, config.mongo.options);
mongoose.connection.on('error', err => {
  console.error(`MongoDB connection error: ${err}`);
  throw new Error('Error connecting to MongoDB');
});

bluebird.Promise.config({
  warnings: false,
});

// Setup server
let app = express();
let server = http.createServer(app);
require('./config/express').default(app);
require('./routes').default(app);

// Start server
function startServer() {
  app.angularFullstack = server.listen(config.port, config.ip, () => {});
}

seedDatabaseIfNeeded();
cronJobForDeleteGeneralDocument();
setImmediate(startServer);

// Create Stripe Plans
// if they not exists in stripe already
_.each(config.subscriptionPlans, p => {
  stripe.plans.retrieve(p.id)
  .catch(e => {
    if(e.statusCode === 404) {
      stripe.plans.create(p)
      .then(plan => {
        console.log(`Stripe plan ${plan.id} created.`);
      })
      .catch(err => {
        throw err;
      });
    }
  });
});

// Create Stripe Coupons
// if they not exists in stripe already
_.each(config.coupons, c => {
  stripe.coupons.retrieve(c.id)
  .catch(e => {
    if(e.statusCode === 404) {
      stripe.coupons.create(c)
      .then(coupon => {
        console.log(`Stripe coupon ${coupon.id} created.`);
      })
      .catch(err => {
        throw err;
      });
    }
  });
});

// Expose app
exports = module.exports = app;
