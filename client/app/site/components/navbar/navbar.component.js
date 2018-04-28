'use strict';

import angular from 'angular';
import _ from 'lodash';
import ModalCtrl from '../modals/modalCtrl';

export class NavbarComponent {
  constructor($location, Auth, $route, $uibModal, $rootScope, Util) {
    'ngInject';

    this.$location = $location;
    this.Auth = Auth;
    this.$route = $route;
    this.$uibModal = $uibModal;
    this.util = Util;
    this.$rootScope = $rootScope;
  }

  isActive(route) {
    return route === this.$location.path();
  }

  logout() {
    if(this.util.isInterviewProcess()) {
      this.$rootScope.$broadcast('saveLogout');
    } else {
      this.completeLogout();
    }
  }

  completeLogout() {
    this.Auth.logout();
    if(this.$location.path() === '/') {
      this.$route.reload();
    } else {
      this.$location.path('/');
    }
  }
  viewProfile() {
    this.$location.path('/profile');
  }

  goToHome() {
    this.$location.path('/').search({});
  }

  goToProducts() {
    this.$location.path('/products');
  }

  login() {
    this.$uibModal.open({
      template: require('../modals/loginRegister.html'),
      controller: ModalCtrl,
      controllerAs: '$ctrl',
      windowClass: 'site-modal',
      backdrop: 'static',
      resolve: {
        modalOpts: () => ({
          modalSwitchToggle: false
        })
      }
    }).result.then(_.noop, _.noop);
  }

  register() {
    this.$uibModal.open({
      template: require('../modals/loginRegister.html'),
      controller: ModalCtrl,
      controllerAs: '$ctrl',
      windowClass: 'site-modal',
      backdrop: 'static',
      resolve: {
        modalOpts: () => ({
          modalSwitchToggle: true
        })
      }
    }).result.then(_.noop, _.noop);
  }
}

export default angular.module('directives.navbar-site', []).component('navbarSite', {
  template: require('./navbar.html'),
  controller: NavbarComponent
}).name;
