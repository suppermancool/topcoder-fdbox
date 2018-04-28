'use strict';

import User from './user.model';
import config from '../../config/environment';
import jwt from 'jsonwebtoken';
import etl from 'etl';
import FinalProduct from '../final-product/final-product.model';
import json2csv from 'json2csv';
import _ from 'lodash';
import * as ctrl from '../../components/api-controller';
import * as Mailer from '../../components/mailer';
import stripe from '../../components/stripe';
import generator from 'generate-password';
const constants = require('../../config/constants');

/**
 * Get user invoices
 * @param  {Object} req The request
 * @param  {Object} res The respnse
 * @return {Promise}
 */
export function getInvoices(req, res) {
  return User.findById(req.params.id).exec()
    .then(user => {
      if(!user.account.stripeCustomerId) {
        const e = new Error(`User ${user.id} is not registered as stripe customer`);
        e.statusCode = 400;
        throw e;
      }
      return stripe.invoices.list({
        customer: user.account.stripeCustomerId,
        date: req.query.date,
        ending_before: req.query.ending_before,
        starting_after: req.query.starting_after,
        limit: req.query.limit,
        subscription: req.query.subscription
      });
    })
    .then(ctrl.respondWithResult(res))
    .catch(e => {
      res.status(e.statusCode || 500);
      res.json({
        error: e.message
      });
    });
}

/**
 * Get members by enterprise
 * @param  {Object} req The request
 * @param  {Object} res The respnse
 * @return {Promise}
 */
export function getMembers(req, res) {
  return User.find({enterprise: req.params.id}, '-salt -password -enterprise')
    .exec()
    .then(data => ({data}))
    .then(ctrl.respondWithResult(res))
    .catch(ctrl.handleError(res));
}

/**
 * Get list of users
 * restriction: 'enterprise'
 */
export const index = (req, res) => {
  let query = {role: {$ne: constants.ENTERPRISE_USER}};

  if(req.user.isEnterprise()) {
    query = {enterprise: req.user._id};
  }

  return User.find(query, '-salt -password').exec()
    .then(users => users.map(user => user.profile))
    .then(data => ({data}))
    .then(ctrl.respondWithResult(res), ctrl.handleError(res));
};

/**
 * Creates a new user
 */
export const create = (req, res) => {
  if(req.body._id) {
    delete req.body._id;
  }

  let newUser = new User(req.body);

  newUser.provider = 'local';
  newUser.account.stripeSource = req.body.stripeSource;

  if(_.isObject(req.body.preferences)) {
    newUser.preferences = _.pick(req.body.preferences, ['standardFontName', 'standardFontSize']);
  } else {
    newUser.preferences = config.defaultUserPreferences;
  }

  if(req.user && req.user.isEnterprise()) {
    newUser.enterprise = req.user;
    return addUser(newUser, res);
  }

  newUser.role = newUser.role ? newUser.role : constants.ENTERPRISE;

  newUser.save()
    .then(user => {
      let token = jwt.sign({ _id: user._id }, config.secrets.session);
      res.json({ token });
    })
    .catch(ctrl.handleValidationError(res));
};

/**
 * Create a new enterprise-user tied to an enterprise
 */
export const addUser = (newUser, res) => {
  newUser.role = constants.ENTERPRISE_USER;
  newUser.save()
    .then(user => user.profile)
    .then(ctrl.respondWithResult(res, 201))
    .catch(ctrl.handleValidationError(res));
};

/**
 * Get a single user
 */
export const show = (req, res) => {
  let userId = req.params.id;
  let query = {_id: userId};

  if(req.user.isEnterprise()) {
    query.enterprise = req.user._id;
  }

  return User.findOne(query)
    .populate('enterprise', 'fname lname email company address postcode vatNumber preferences country')
    .exec()
    .then(ctrl.handleEntityNotFound(res))
    .then(user => user && user.detailedProfile)
    .then(ctrl.respondWithResult(res))
    .catch(ctrl.handleError(res));
};

/**
 * Deletes a user
 * restriction: 'enterprise'
 */
export const destroy = (req, res) => {
  let query = {_id: req.params.id};

  if(req.user.role === constants.ENTERPRISE) {
    query.enterprise = req.user._id;
  }

  return User.findOne(query).exec()
    .then(ctrl.handleEntityNotFound(res))
    .then(ctrl.removeEntity(res))
    .catch(ctrl.handleError(res));
};

/**
 * Change a users password
 */
export const changePassword = (req, res) => {
  let userId = req.user._id;
  let oldPass = String(req.body.oldPassword);
  let newPass = String(req.body.newPassword);


  return User.findById(userId).exec()
    .then(user => {
      if(user.authenticate(oldPass)) {
        if(oldPass === newPass) {
          return ctrl.handleError(res, 400)({
            code: 'same_password',
            message: 'Old password and new password must be different',
          });
        }

        user.password = newPass;
        return user.save()
          .then(ctrl.noContent(res))
          .catch(ctrl.handleValidationError(res));
      } else {
        return ctrl.handleForbidden(res)();
      }
    });
};

export const resetPassword = (req, res) => {
  let password = generator.generate({
    length: 10,
    numbers: true
  });

  return User.find({email: req.body.email}).exec()
    .then(users => {
      if(users[0]) {
        Mailer.send({
          to: req.body.email,
          subject: 'Password reset',
          text: `Your password: ${password}`
        }).then(info => {
          console.log(info);
          users[0].password = password;
          return users[0].save()
            .then(ctrl.noContent(res))
            .catch(ctrl.handleValidationError(res));
        })
          .catch(err => {
            console.error(`Error while sending email: ${err.message}`);
            return Promise.reject({status: 500, message: 'Error while sending your email.'});
          });
      }
    })
    .then(result => result && res.status(204).send())
    .catch(ctrl.handleError(res));
};

/**
 * Get my info
 */
export const me = (req, res) => {
  let userId = req.user._id;

  return User.findOne({ _id: userId }, '-salt -password -__v')
    .populate('enterprise', 'fname lname email company city address postcode vatNumber preferences country')
    .exec()
    .then(ctrl.handleEntityNotFound(res, 401))
    .then(ctrl.respondWithResult(res))
    .catch(ctrl.handleError(res));
};

/**
 * Update my info
 */
export const updateMe = (req, res) => {
  let userId = req.user._id;

  return updateUserData(req, res, {_id: userId});
};

/**
 * Update user info
 */
export const updateUser = (req, res) => {
  let userId = req.params.id;
  let query = {_id: userId};

  if(req.user.isEnterprise()) {
    query.enterprise = req.user;
  }

  return updateUserData(req, res, query);
};

/**
 * The actual implementation for update user info
 */
const updateUserData = (req, res, query) => {
  // let user update only part of info
  let updates = _.pick(req.body, [
    'email', 'company', 'lname', 'fname', 'address', 'postcode', 'vatNumber', 'city', 'password', 'role'
  ]);

  if(_.isObject(req.body.preferences)) {
    updates.preferences = _.pick(req.body.preferences, ['standardFontName', 'standardFontSize']);
  }
  if(_.isObject(req.body.account)) {
    if(req.body.account.stripeSource) {
      updates.account = _.pick(req.body.account, ['stripeSource']);
    }
    if(req.body.account.billingDiscount) {
      updates.account = _.pick(req.body.account, ['billingDiscount']);
    }
  }

  // run the updates
  return User.findById(query)
    .then(user => {
      _.merge(user, updates);
      if(req.body.account && !req.body.account.billingDiscount && user.account.billingDiscount) {
        // Handle remove billingDiscount
        user.account.billingDiscount = undefined;
      }
      return user.save();
    })
    .then(ctrl.handleEntityNotFound(res))
    .then(user => user && user.detailedProfile)
    .then(ctrl.respondWithResult(res))
    .catch(ctrl.handleValidationError(res))
    .catch(ctrl.handleMongoError(res))
    .catch(ctrl.handleError(res));
};

/**
 * Generate user's usage report in csv format
 */
export const generateUsage = (req, res) => {
  let userId = req.params.id;
  let query = FinalProduct.find({}, '-files');
  res.set({
    'Content-Type': 'application/octet-stream',
    'Content-Disposition': 'attachment; filename=usage.csv',
  });

  if(userId) {
    query = FinalProduct.find({account: userId}, '-files');
  }

  query
    .populate('user')
    .populate({path: 'product', populate: {path: 'category'}});

  return query.exec()
    .then(products => products.map(fprod => ({
      'User name': fprod.user === null ? '' : fprod.user.fullName,
      'User email': fprod.user === null ? '' : fprod.user.email,
      'Product name': fprod.product === null ? '' : fprod.product.title,
      'Product category': fprod.product === null ? '' : fprod.product.category.title,
      'Date generated': fprod.createdAt === null ? '' : fprod.createdAt,
    })))

    .then(data => json2csv({data, fields: Object.keys(data[0] || {})}))
    .then(data => etl.toStream(data).pipe(res))
    .then(() => res.end());
};

/**
 * Authentication callback
 */
export const authCallback = (req, res) => {
  res.redirect('/');
};
