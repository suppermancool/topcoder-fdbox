/**
 * Main application routes
 */

'use strict';

import errors from './components/errors';
import express from 'express';
import path from 'path';
import config from './config/environment';

import * as auth from './auth/auth.service';
import {isOwner} from './api/final-product/middleware';

export default function(app) {
  // Insert routes below
  app.use('/api/finalprods', require('./api/final-product'));
  app.use('/api/categories', require('./api/category'));
  app.use('/api/products', require('./api/product'));
  app.use('/api/users', require('./api/user'));
  app.use('/api/interviews', require('./api/interview'));
  app.use('/api/invoices', require('./api/invoices'));
  app.use('/api/order/invoices', require('./api/order-invoice'));
  app.use('/api/customer/invoices', require('./api/customer-invoice'));
  app.use('/api/stripe', require('./api/stripe'));
  app.use('/api/messages', require('./api/message'));

  app.use('/auth', require('./auth').default);

  app.use('/assets/uploads/templates', auth.hasRole('admin'),
    express.static(`${config.uploads.dir}${config.uploads.templates}`));

  app.use('/assets/uploads/docx/:dirHash', auth.parseAuthHeaders(), isOwner(),
    express.static(`${config.uploads.dir}${config.uploads.docs}/`));

  app.use('/assets', express.static(`${config.uploads.parent}`));

  // All undefined asset or api routes should return a 404
  app.route('/:url(api|auth|components|app|bower_components|assets)/*')
   .get(errors[404]);

  // All other routes should redirect to the index.html
  app.route('/*')
    .get((req, res) => {
      res.sendFile(path.resolve(`${app.get('appPath')}/index.html`));
    });
}
