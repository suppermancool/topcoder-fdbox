'use strict';
import config from '../config/environment';
import jwt from 'jsonwebtoken';
import expressJwt from 'express-jwt';
import compose from 'composable-middleware';
import User from '../api/user/user.model';

const validateJwt = expressJwt({
  secret: config.secrets.session
});

const handleErr = (next, res, statusCode, err) =>
  err ? res.status(statusCode).json(err) : next();

/**
 * Attaches the user object to the request if authenticated
 */
export function parseAuthHeaders() {
  return compose()
    // Validate jwt
    .use((req, res, next) => {
      // allow access_token to be passed through query parameter as well
      if(req.query && req.query.hasOwnProperty('access_token')) {
        req.headers.authorization = `Bearer ${req.query.access_token}`;
      }
     // IE11 forgets to set Authorization header sometimes. Pull from cookie instead.
      if(req.query && typeof req.headers.authorization === 'undefined') {
        req.headers.authorization = `Bearer ${req.cookies.token}`;
      }

      // parse auth headers
      if(req.headers.authorization && req.headers.authorization !== 'Bearer undefined') {
        return validateJwt(req, res, handleErr.bind(0, next, res, 401));
      }

      return next();
    })
    // Attach user to request
    .use((req, res, next) => {
      if(!req.user) {
        return next();
      }

      return User.findById(req.user._id).exec()
        .then(user => {
          req.user = user;
          return next();
        })
        .catch(handleErr.bind(0, next, res, 500));
    });
}

/**
 * isAuthenticated If no user is attached to request, return 401
 */
export function isAuthenticated() {
  return parseAuthHeaders()
    .use((req, res, next) => {
      if(!req.user) {
        return res.status(401).json({code: 'unauthorized', message: 'Unauthorized!'});
      }

      return next();
    });
}

/**
 * Checks if the user role meets the minimum requirements of the route
 */
export function hasRole(roleRequired) {
  if(!roleRequired) {
    throw new Error('Required role needs to be set');
  }

  return compose()
    .use(isAuthenticated())
    .use((req, res, next) => {
      if(config.userRoles.indexOf(req.user.role) >= config.userRoles.indexOf(roleRequired)) {
        return next();
      } else {
        return res.status(403).json({code: 'forbidden', message: 'Forbidden!'});
      }
    });
}

/**
 * Returns a jwt token signed by the app secret
 */
export function signToken(id, role) {
  return jwt.sign({ _id: id, role }, config.secrets.session);
}

/**
 * Set token cookie directly for oAuth strategies
 */
export function setTokenCookie(req, res) {
  if(!req.user) {
    return res.status(404).send('It looks like you aren\'t logged in, please try again.');
  }
  const token = signToken(req.user._id, req.user.role);
  res.cookie('token', token);
  res.redirect('/');
}
