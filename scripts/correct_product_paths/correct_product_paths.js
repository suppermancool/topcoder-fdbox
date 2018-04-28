/**
 * Correct product.templates.files[].path in DB
 * convert path, absulute to relative
 */

'use strict';
import config from '../../server/config/environment/index';
import mongoose from 'mongoose';
import path from 'path';
import bluebird from 'bluebird';
mongoose.Promise = require('bluebird');
import Product from '../../server/api/product/product.model';

// Expose app
exports = module.exports = (() => {
  // Connect to MongoDB
  mongoose.connect(config.mongo.uri, config.mongo.options);
  mongoose.connection.on('error', err => {
    console.error(`MongoDB connection error: ${err}`);
    process.exit(-1); // eslint-disable-line no-process-exit
  });

  bluebird.Promise.config({
    warnings: false,
  });

  Product.find({})
    .then(products => {
      products.forEach(product => {
        //resolve the product path to relative
        let templates = Object.assign({}, product.templates);
        templates.files.forEach(file => {
          if(file && file.path && path.isAbsolute(file.path)) {
            file.path = file.path.substring(44);
          }
        });

        templates.translations.forEach(file => {
          if(file && file.path && path.isAbsolute(file.path)) {
            file.path = file.path.substring(44);
          }
        });

        //save the product
        product.update({ templates })
          .then(() => {
            console.log('product updated:' + product.id);
          })
          .catch(err => {
            // error saving products
            console.error('error saving product', err);
          });
      });
    })
    .then(() => {
      //close the connection
      mongoose.connection.close();
    })
    .catch(err => {
      // error populating products
      console.error('error populating product', err);
    });
})();
