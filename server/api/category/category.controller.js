'use strict';

import Category from './category.model';
import Product from '../product/product.model';
import * as ctrl from '../../components/api-controller';
import _ from 'lodash';

// Gets a list of Categories
export const index = (req, res) => {
  Category.find({}, '-__v')
    .exec()
    .then(data =>
      Product.find().then(products => {
        let categories = [];
        for(let i in data) {
          let prods = _.filter(products, val =>
            val.category.equals(data[i]._id)
          );
          let newObj = data[i].toObject();
          categories.push({
            id: newObj._id,
            updatedAt: newObj.updatedAt,
            createdAt: newObj.createdAt,
            title: newObj.title,
            description: newObj.description,
            productCount: prods.length
          });
        }
        return {data: categories};
      })
    )
    .then(ctrl.respondWithResult(res))
    .catch(ctrl.handleError(res));
};

// Gets a single Category from the DB
export const show = (req, res) =>
  Category.findById(req.params.id, '-__v').exec()
    .then(ctrl.handleEntityNotFound(res))
    .then(ctrl.respondWithResult(res))
    .catch(ctrl.handleError(res));

// Creates a new Category in the DB
export const create = (req, res) =>
  Category.create(req.body)
    .then(ctrl.respondWithResult(res, 201))
    .catch(ctrl.handleValidationError(res))
    .catch(ctrl.handleError(res));

// Updates the given Category in the DB at the specified ID
export const update = (req, res) => {
  if(req.body._id) {
    delete req.body._id;
  }

  return Category.findOneAndUpdate({_id: req.params.id}, req.body, {new: true, runValidators: true}).exec()
    .then(ctrl.handleEntityNotFound(res))
    .then(ctrl.respondWithResult(res))
    .catch(ctrl.handleValidationError(res))
    .catch(ctrl.handleMongoError(res))
    .catch(ctrl.handleError(res));
};

// Deletes a Category from the DB
export const destroy = (req, res) =>
  Category.findById(req.params.id).exec()
    .then(ctrl.handleEntityNotFound(res))
    .then(category =>
      category && Product.count({category})
      .then(count => count === 0 ? category : (ctrl.handleError(res, 400)({
        code: 'dependent_products',
        message: `Couldn\'t delete the category because it has ${count} products that depend on it!`,
      }), null))
    )
    .then(ctrl.removeEntity(res))
    .catch(ctrl.handleError(res));
