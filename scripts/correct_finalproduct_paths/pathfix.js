/**
 * Correct finalproduct paths in DB
 * convert paths, absolute to relative
 * removes obsolete dirPath field
 */

'use strict';
import config from '../../server/config/environment/index';
import mongoose from 'mongoose';
import path from 'path';
import bluebird from 'bluebird';
mongoose.Promise = require('bluebird');
import FinalProduct from '../../server/api/final-product/final-product.model';

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

  FinalProduct.find({})
    .then(products => {
      products.forEach(product => {
        //resolve the product path to relative
        let files = product.files.map(file => Object.assign({}, file));
        files.forEach(file => {
          if(file.downloadAllUrl && file.downloadAllUrl.indexOf('/assets/uploads/docx') === 0) {
            file.downloadAllUrl = file.downloadAllUrl.substring(20);
          }
          file.documents.forEach(document => {
            if(document.downloadUrl && document.downloadUrl.indexOf('/assets/uploads/docx') === 0) {
              document.downloadUrl = document.downloadUrl.substring(20);
            }

            let previewImageList = [];
            previewImageList = document.previewImage.split('<>');
            let correctedImages = previewImageList.map(image => {
              if(image && image.indexOf('/assets/uploads/docx') === 0) {
                return image.substring(20);
              }
                return image;
            });
            document.previewImage = correctedImages.join('<>');
          });
        });

        //save the finalproduct
        product.update( { files } )
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
  // remove obsolete dirPath field
  FinalProduct.collection.update({},
    {$unset: {dirPath: true}},
    {multi: true, safe: true});

})();
