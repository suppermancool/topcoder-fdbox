/**
 * Using Rails-like standard naming convention for endpoints.
 * POST    /api/interviews       ->  create
 * GET     /api/interviews       ->  getInterviews
 * GET     /api/interviews/:id   ->  show
 * PUT     /api/interviews/:id   ->  update
 * DELETE  /api/interviews/:id   ->  destroy
 */

'use strict';

import Interview from './interview.model';
import * as ctrl from '../../components/api-controller';

/**
 * Get user's saved interviews
 * @param  {Object} req The request
 * @param  {Object} res The response
 * @return {Promise}
 */
export const getInterviews = (req, res) => {
  let userId = req.user._id;
  let query = {user: userId};

  return Interview.find(query)
    .populate('product')
    .exec()
    .then(ctrl.handleEntityNotFound(res))
    .then(ctrl.respondWithResult(res))
    .catch(ctrl.handleError(res));
};

/**
 * Creates a new interview
 */
export const create = (req, res) => {
  if(req.body._id) {
    delete req.body._id;
  }
  Interview.create(req.body)
  .then(ctrl.respondWithResult(res, 201))
  .catch(ctrl.handleValidationError(res))
  .catch(ctrl.handleError(res));
};

/**
 * Get a single interview
 */
export const show = (req, res) => {
  let intId = req.params.id;
  let userId = req.user._id;
  let query = {_id: intId, user: userId};

  return Interview.findOne(query)
    .populate('product')
    .exec()
    .then(ctrl.handleEntityNotFound(res))
    .then(ctrl.respondWithResult(res))
    .catch(ctrl.handleError(res));
};

/**
 * Deletes an interview
 */
export const destroy = (req, res) => {
  let query = {_id: req.params.id};

  return Interview.findOne(query).exec()
    .then(ctrl.handleEntityNotFound(res))
    .then(ctrl.removeEntity(res))
    .catch(ctrl.handleError(res));
};

/**
 * Deletes all interviews
 */
export const deleteInterviews = (req, res) => {
  let userId = req.user._id;
  let query = {user: userId};

  return Interview.deleteMany(query).exec()
    .then(ctrl.handleEntityNotFound(res))
    .then(() => res.status(204).end())
    .catch(ctrl.handleError(res));
};

/**
 * Update interview data
 */
export const updateInterview = (req, res) => {
  let intId = req.params.id;
  let userId = req.user._id;
  let query = {_id: intId, user: userId};
  let updates = {details: req.body.details};

  return Interview.findOneAndUpdate(query, { $set: updates }, { new: true, runValidators: true })
    .exec()
    .then(ctrl.handleEntityNotFound(res))
    .then(ctrl.respondWithResult(res))
    .catch(ctrl.handleValidationError(res))
    .catch(ctrl.handleMongoError(res))
    .catch(ctrl.handleError(res));
};
