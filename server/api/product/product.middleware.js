import config from '../../config/environment';

import fs from 'fs';
import path from 'path';
import xml2js from 'xml2js';
import mkdirp from 'mkdirp';
import compose from 'composable-middleware';
import Category from '../category/category.model';
import { uuid } from '../../components/util';
import _ from 'lodash';
import extract from 'extract-zip';

import * as ctrl from '../../components/api-controller';

const invalidUpload = (res, message) =>
  ctrl.handleError(res, 422)({ message, code: 'invalid_upload' });

/**
 * Check if provided path is valid
 * If it isn't, create it
 */
const checkPath = dirPath => new Promise((resolve, reject) => {
  mkdirp(dirPath, err => {
    if(err) {
      return reject(err);
    }

    resolve();
  });
});

/**
 * Get relative path of given file path relative to config.uploads.dir
 * @param filePath file path
 */
const getRelativePath = filePath => {
  if(filePath) {
    return path.relative(config.uploads.dir, filePath);
  }
  return undefined;
};

// check if there's anything to upload, and handle the file
export const handleProductUpload = () =>
  compose()
    // check if a file was sent for upload
    // and attach it to request `req.productFiles`
    .use((req, res, next) => {
      res.statusCode = null;
      // check if a file was sent for upload
      if(!(req.uploads && req.uploads.file)) {
        return invalidUpload(res, 'No valid configuration file was provided');
      }

      let { file } = req.uploads;
      // path to unzip the upload: uploadsDir/templates
      let tmplDir = path.resolve(config.uploads.dir, `${config.uploads.templates}/${uuid()}`);

      checkPath(tmplDir).then(() => {// check if valid path, create folders if not
        // master === the main xml file, which dictates the template names and the interview
        req.productFiles = { master: null, templates: [] };
        extract(file.path, {
          dir: tmplDir, onEntry: entry => {
            let filePath = path.resolve(tmplDir, entry.fileName);
            let fileObj = { filename: entry.fileName, path: filePath };
            if(entry.fileName.match(/\.xml$/i)) {
              req.productFiles.master = fileObj;
            } else {
              req.productFiles.templates.push(fileObj);
            }
          }
        }, err => {
          if(err) {
            return invalidUpload(res, 'Invalid zip file');
          }
          return next();
        });
      });
    })

    // if req.productFiles is present and we have a master file,
    // parse the master file and store it
    .use((req, res, next) => {
      if(!req.productFiles) {
        return next();
      }

      let { master } = req.productFiles;
      if(!master) {
        return invalidUpload(res, 'Master file is missing');
      }

      const parser = new xml2js.Parser({ attrkey: 'attrs' });

      fs.readFile(master.path, (err, data) => {
        if(err) {
          return invalidUpload(res, `Invalid master file: ${err.message}`);
        }

        parser.parseString(data, (err, json = {}) => {
          if(err) {
            return invalidUpload(res, `Invalid master file: ${err.message}`);
          }

          if(!json) {
            return invalidUpload(res, 'Invalid master file: empty file');
          }

          master.json = json.fbdox;
          next();
        });
      });
    })

    // parse the master file, and create a link between the uploaded templates and the
    // templates in the master file
    .use((req, res, next) => {
      if(!req.productFiles) {
        return next();
      }

      let templateFiles = req.productFiles.templates;
      if(!templateFiles || !templateFiles.length) {
        return invalidUpload(res, 'No templates were provided');
      }

      let product = Object.assign({}, req.body);
      let replaceFn = str => str.replace(/int\((.*)\)/i, '($1|int)');

      let mapToFile = tmplFile => ({
        name: tmplFile.attrs.name,
        path: getRelativePath((templateFiles.find(file => file.filename === tmplFile.attrs.name) || {}).path),
        when: Object.keys(tmplFile.attrs)
          .filter(key => /^if/i.test(key))
          .map(key =>
            replaceFn(tmplFile.attrs[key])),
      });

      if(_.isUndefined(req.productFiles.master.json.templates[0].file_trans)) {
        return invalidUpload(res, 'file_trans nodes are not present in configuration.xml');
      }

      product.templates = {
        files: req.productFiles.master.json.templates[0].file.map(mapToFile),
        translations: req.productFiles.master.json.templates[0].file_trans.map(mapToFile),
      };

      product.interview = req.productFiles.master.json.interview[0];
      req.body = product;

      if(!_.isUndefined(product.interview.attrs.name)) {
        req.body.title = product.interview.attrs.name;
      }

      if(!_.isUndefined(product.interview.attrs.description)) {
        req.body.description = product.interview.attrs.description;
      }

      if(!_.isUndefined(product.interview.attrs.category)) {
        Category.find({}, '-__v').exec()
          .then(data => {
            let category = _.find(data, val => val.title === product.interview.attrs.category);
            if(!_.isNull(category)) {
              req.body.category = category._id;
            }
            return next();
          });
      } else {
        return next();
      }
    });
