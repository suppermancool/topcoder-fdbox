'use strict';

import angular from 'angular';
import _ from 'lodash';
import ModalCtrl from '../../app/site/components/modals/modalCtrl';

class _User {
  _id = '';
  name = '';
  email = '';
  role = '';
  $promise = undefined;
}

export function AuthService($location, $http, $cookies, $q, appConfig, Util, User, $interval, $uibModal) {
  'ngInject';

  const safeCb = Util.safeCb;
  let currentUser = new _User();
  let userRoles = appConfig.userRoles || [];
  let checkExpire;
  /**
   * Check if userRole is >= role
   * @param {String} userRole - role of current user
   * @param {String} role - role to check against
   */
  let hasRole = (userRole, role) =>
    userRoles.indexOf(userRole) >= userRoles.indexOf(role);

  if($cookies.get('token') && $location.path() !== '/logout') {
    currentUser = User.get();
    checkToken();
  }

  let Auth = {
    /**
     * Authenticate user and save token
     *
     * @param  {Object}   user     - login info
     * @param  {Function} callback - function(error, user)
     * @return {Promise}
     */
    login({email, password}, callback) {
      return $http.post('/auth/local', {
        email,
        password
      }, {headers: {'Content-Type': 'application/json'}})
        .then(res => {
          let expireDate = new Date();
          expireDate.setFullYear(expireDate.getFullYear() + 20);
          let cookieConf = window.location.protocol === 'https:' ? {expires: expireDate, secure: true} : {expires: expireDate};
          $cookies.put('token', res.data.token, cookieConf);
          currentUser = User.get();
          return currentUser.$promise;
        })
        .then(user => {
          checkToken();
          safeCb(callback)(null, user);
          return user;
        })
        .catch(err => {
          Auth.logout();
          safeCb(callback)(err.data);
          return $q.reject(err.data);
        });
    },

    /**
     * Delete access token and user info
     */
    logout() {
      $cookies.remove('token');
      if(angular.isDefined(checkExpire)) {
        $interval.cancel(checkExpire);
        checkExpire = undefined;
      }
      currentUser = new _User();
    },

    /**
     * Create a new user
     *
     * @param  {Object}   user     - user info
     * @param  {Function} callback - function(error, user)
     * @return {Promise}
     */
    createUser(user, callback) {
      return User.save(user, data => {
        let expireDate = new Date();
        expireDate.setFullYear(expireDate.getFullYear() + 20);
        let cookieConf = window.location.protocol === 'https:' ? {expires: expireDate, secure: true} : {expires: expireDate};
        $cookies.put('token', data.token, cookieConf);
        checkToken();
        currentUser = User.get();
        return safeCb(callback)(null, user);
      }, err => {
        Auth.logout();
        return safeCb(callback)(err);
      })
        .$promise;
    },

    /**
     * Change password
     *
     * @param  {String}   oldPassword
     * @param  {String}   newPassword
     * @param  {Function} callback    - function(error, user)
     * @return {Promise}
     */
    changePassword(oldPassword, newPassword, callback) {
      return User.changePassword(
        {id: currentUser.id},
        { oldPassword, newPassword},

        () => safeCb(callback)(null),
        err => safeCb(callback)(err)
      )
      .$promise;
    },

    /**
     * Gets all available info on a user
     *
     * @param  {Function} [callback] - function(user)
     * @return {Promise}
     */
    getCurrentUser(callback) {
      let value = _.get(currentUser, '$promise') ? currentUser.$promise : currentUser;

      return $q.when(value)
        .then(user => {
          safeCb(callback)(user);
          return user;
        }, () => {
          safeCb(callback)({});
          return {};
        });
    },

    /**
     * Gets all available info on a user
     *
     * @return {Object}
     */
    getCurrentUserSync() {
      return currentUser;
    },

    /**
     * Gets all available info on a user freshly from db
     *
     * @return {Object}
     */
    getCurrentUserNow() {
      return User.get().$promise;
    },
    /**
     * refresh currentUser if stale
     *
     * @return {Bool}
     */
    refreshCurrentUser(freshUser) {
      if(freshUser !== currentUser) {
        currentUser = freshUser;
        return true;
      }
      return false;
    },
    /**
     * Check if a user is logged in
     *
     * @param  {Function} [callback] - function(is)
     * @return {Promise}
     */
    isLoggedIn(callback) {
      return Auth.getCurrentUser(undefined)
        .then(user => {
          let is = _.get(user, 'role');

          safeCb(callback)(is);
          return is;
        });
    },

    /**
     * Check if a user is logged in
     *
     * @return {Bool}
     */
    isLoggedInSync() {
      return !!_.get(currentUser, 'role');
    },

    /**
     * Check if a user has a specified role or higher
     *
     * @param  {String}     role     - the role to check against
     * @param  {Function} [callback] - function(has)
     * @return {Promise}
     */
    hasRole(role, callback) {
      return Auth.getCurrentUser(undefined)
        .then(user => {
          let has = hasRole(_.get(user, 'role'), role);
          safeCb(callback)(has);
          return has;
        });
    },

    /**
     * Check if a user has a specified role or higher
     *
     * @param  {String} role - the role to check against
     * @return {Bool}
     */
    hasRoleSync(role) {
      return hasRole(_.get(currentUser, 'role'), role);
    },

    /**
     * Check if a user is an admin
     *   (synchronous|asynchronous)
     *
     * @param  {Function|*} callback - optional, function(is)
     * @return {Bool|Promise}
     */
    isAdmin(...args) {
      return Auth.hasRole(...['admin', ...args]);
    },

    /**
     * Check if a user is an admin
     *
     * @return {Bool}
     */
    isAdminSync() {
      return Auth.hasRoleSync('admin');
    },

    /**
     * Get auth token
     *
     * @return {String} - a token string used for authenticating
     */
    getToken() {
      return $cookies.get('token');
    },

    /**
     * Update current user
     *
     * @param  {Object}   user     - user info
     * @return {Promise}
     */
    updateMe(user) {
      return User.updateMe(user)
      .$promise;
    }
  };

  function checkToken() {
    if($cookies.get('token') && !angular.isDefined(checkExpire)) {
      checkExpire = $interval(() => {
        if(!$cookies.get('token')) {
          Auth.logout();
          $uibModal.open({
            template: require('../../app/site/components/modals/expired.html'),
            controller: ModalCtrl,
            controllerAs: '$ctrl',
            windowClass: 'site-modal',
            resolve: {
              modalOpts: () => {}
            }
          }).result.then(_.noop, _.noop);
        }
      }, 30000);
    }
  }

  return Auth;
}
