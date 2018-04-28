/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/products              ->  index
 * POST    /api/products              ->  create
 * GET     /api/products/:id          ->  show
 * PUT     /api/products/:id          ->  update
 * DELETE  /api/products/:id          ->  destroy
 * POST    /api/products/:id/orders   ->  order it
 */

'use strict';

import Product from './product.model';
import FinalProduct from '../final-product/final-product.model';
import User from '../user/user.model';
import config from '../../config/environment';
import { uuid } from '../../components/util';
import { tmplToDocx, exprParser } from '../../components/docx/parser.service';
import etl from 'etl';
import JSZip from 'jszip';
import path from 'path';
import * as ctrl from '../../components/api-controller';
import stripe from '../../components/stripe';
import _ from 'lodash';
import moment from 'moment';
const constants = require('../../config/constants');

/**
 * Place order for product
 * @param  {Object} req The request
 * @param  {Object} res The respnse
 */
export function orderProduct(req, res) {
  Product.findById(req.params.id)
    .then(ctrl.handleEntityNotFound(res))
    .then(product =>
      User.findById(req.body.user)
        .populate('enterprise')
        .then(ctrl.handleEntityNotFound(res))
        .then(user => {
          if(!user.account.stripeCustomerId) {
            const e = new Error();
            e.error = 'No stripe customer ID associated with the user';
            res.statusCode = 400;
            throw e;
          }

          let customer = user.account.stripeCustomerId;
          let orderedById = user.account.stripeCustomerId;
          if(user.role === constants.ENTERPRISE_USER) {
            customer = user.enterprise.account.stripeCustomerId;
          }
          //create product order, billed at next sub invoice date
          return stripe.invoiceItems.create({
            amount: 1000,
            currency: product.currency,
            customer,
            description: product.title,
            metadata: {
              orderedById,
              title: product.title,
              description: product.description,
              parent: product.stripeSKUId,
              quantity: 1
            }
          });
        })
    )
    .then(ctrl.respondWithResult(res))
    .catch(ctrl.handleError(res));
}

// Gets a list of Products
export const index = (req, res) =>
  Product.find()
    .sort('-title')
    .populate('category', 'title')
    .exec()
    .then(prods => prods.map(prod => prod.details))
    .then(data => ({ data }))
    .then(ctrl.respondWithResult(res))
    .catch(ctrl.handleError(res));

// Gets a single Product from the DB
export const show = (details = 'details', req, res) =>
  Product.findById(req.params.id)
    .populate('category')
    .exec()
    .then(ctrl.handleEntityNotFound(res))
    .then(prod => prod[details])
    .then(ctrl.respondWithResult(res))
    .catch(ctrl.handleError(res));

// Creates a new Product in the DB
export const create = (req, res) => {
  if(req.body._id) {
    delete req.body._id;
  }

  return Product.create(req.body)
    .then(prod => prod.details)
    .then(ctrl.respondWithResult(res, 201))
    .catch(ctrl.handleValidationError(res));
};

// Updates the given Product in the DB at the specified ID
export const update = (req, res) => {
  if(req.body._id) {
    delete req.body._id;
  }

  return Product.findOneAndUpdate({ _id: req.params.id }, { $set: req.body }, { new: true, runValidators: true })
    .populate('category', 'title')
    .exec()
    .then(ctrl.handleEntityNotFound(res))
    .then(prod => prod && prod.details)
    .then(prod =>
      stripe.products.update(prod.stripeProductId, {
        description: prod.description,
        name: prod.title
      })
    )
    .then(ctrl.respondWithResult(res))
    .catch(ctrl.handleValidationError(res))
    .catch(ctrl.handleError(res));
};

// Deletes a Product from the DB
export const destroy = (req, res) => {
  res.statusCode = null;
  Product.findById(req.params.id)
    .exec()
    .then(ctrl.handleEntityNotFound(res))
    .then(ctrl.removeEntity(res))
    .catch(ctrl.handleError(res));
};

// Generate the final documents based on the provided data
export const saveInterview = (req, res) => {
  const interviewData = req.body;
  const dirHash = uuid();
  const tmpDir = `${config.uploads.docs}/${dirHash}`; //unique directory for each final product
  const zip = new JSZip(); // the final zip with all final documents
  const preferences = interviewData.PREFS ? interviewData.PREFS : config.defaultUserPreferences;
  let previews;

  console.log('Initialization complete');

  // Correct the date format.
  _.each(interviewData, (field, key) => {
    if(moment.utc(field, moment.ISO_8601).isValid()) {
      interviewData[key] = moment.utc(field).format('D.M.YYYY');
    }
  });

  console.log('Date Format complete');

  Product.findById(req.params.id)
    .exec()
    .then(product => {
      console.log('Product found');
      // Get the templates needed to generate the document
      let templates;

      if(!(product && product.templates)) {
        throw new Error('Invalid product selected. Document cannot be generated at this time');
      }

      req.product = product;

      templates = []
        .concat(product.templates.files || [])
        .map(template => {
          let visible;

          visible = (template.when || []).reduce((prev, expr) => prev && exprParser(expr, interviewData), true);

          if(!visible || !template.path) {
            return null;
          }

          return template;
        })
        .filter(template => !!template);

      console.log('Template parsing completed. Template count is', templates.length);

      if(templates.length > 0) {
        return templates;
      }

      throw new Error('Document generation conditions not satisfied. Document cannot be generated');
    })
    .then(templates => {
      const documents = templates.map(template => {
        let params = {
          input: path.resolve(config.uploads.dir, template.path),
          outDir: tmpDir,
          outFile: template.name,
          data: interviewData,
          preferences
        };

        console.log('Generating document using the following configuration', params);

        return tmplToDocx(params)
          .then(document => {
            console.log('Document generation completed for', params.input);
            zip.file(document.file, document.fileBuffer);

            return document;
          })
          .then(document => {
            const preview = {
              title: template.name,
              downloadUrl: `/${dirHash}/${document.file}`,
              previewImage: '',
              numOfPages: `${document.numOfPages}`,
              size: `${document.size}`
            };
            const images = [];
            document.previewImage.forEach(image => {
              images.push(`/${dirHash}/${image}`);
            });
            preview.previewImage = images.join('<>');
            return preview;
          });
      });

      return Promise.all(documents);
    })
    .then(documents => {
      previews = {
        documents
      };
    })
    .then(() => {
      console.log('Converting to zip file');
      return etl
        .toStream(zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' }))
        .pipe(etl.toFile(path.resolve(config.uploads.dir, tmpDir, `${req.product.title}.zip`)))
        .promise();
    })
    .then(() => {
      console.log('ZIP file generation completed. Setting up the download URL');
      previews.downloadAllUrl = `/${dirHash}/${req.product.title}.zip`;
    })
    .then(() => {
      console.log('Storing the generated document details in database');
      return FinalProduct.create({
        dirHash,
        user: req.user,
        account: req.user.enterprise || req.user,
        product: req.product,
        files: previews
      });
    })
    .then(finalProduct => {
      console.log('Sending the details', finalProduct);
      previews.finalProductId = finalProduct._id;

      res.send(previews);
    })
    .catch(error => {
      console.log('Error during document generation', error);
      res.status(500).send('Could not generate the document at this time. Please try again later');
    });
};
