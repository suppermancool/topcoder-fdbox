'use strict';

import Message from './message.model';
import * as ctrl from '../../components/api-controller';
import { sample } from 'lodash';

// Return all messages
export const index = (req, res) =>
  Message.find({}, '-__v')
    .sort('-createdAt')
    .exec()
    .then(data => ({ data }))
    .then(ctrl.respondWithResult(res))
    .catch(ctrl.handleError(res));

// Gets a random message
export const random = (req, res) => {
  Message.find({}, '-__v')
    .exec()
    .then(data => ({message: sample(data).text}))
    .then(ctrl.respondWithResult(res))
    .catch(ctrl.handleError(res));
};

// Gets a single Message from the DB
export const show = (req, res) =>
  Message.findById(req.params.id, '-__v').exec()
    .then(ctrl.handleEntityNotFound(res))
    .then(ctrl.respondWithResult(res))
    .catch(ctrl.handleError(res));

// Creates a new Message in the DB
export const create = (req, res) =>
  Message.create(req.body)
    .then(ctrl.respondWithResult(res, 201))
    .catch(ctrl.handleValidationError(res))
    .catch(ctrl.handleError(res));

// Updates the given Message in the DB at the specified ID
export const update = (req, res) => {
  if(req.body._id) {
    delete req.body._id;
  }

  return Message.findOneAndUpdate({_id: req.params.id}, req.body, {new: true, runValidators: true}).exec()
    .then(ctrl.handleEntityNotFound(res))
    .then(ctrl.respondWithResult(res))
    .catch(ctrl.handleValidationError(res))
    .catch(ctrl.handleMongoError(res))
    .catch(ctrl.handleError(res));
};

// Deletes a Message from the DB
export const destroy = (req, res) =>
  Message.findById(req.params.id).exec()
    .then(ctrl.handleEntityNotFound(res))
    .then(ctrl.removeEntity(res))
    .catch(ctrl.handleError(res));
