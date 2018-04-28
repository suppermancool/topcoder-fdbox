'use strict';
/* eslint no-sync: 0 */

import angular from 'angular';

export class NavbarComponent {
  menu = [{
    title: 'Users',
    link: '/admin/users'
  }, {
    title: 'Products',
    link: '/admin/products'
  }, {
    title: 'Product Categories',
    link: '/admin/categories'
  }, {
    title: 'Wait Messages',
    link: '/admin/messages'
  }];

  isCollapsed = true;

  constructor($location, Auth) {
    'ngInject';

    this.$location = $location;
    this.isLoggedIn = Auth.isLoggedInSync;
    this.isAdmin = Auth.isAdminSync;
    this.getCurrentUser = Auth.getCurrentUserSync;
  }

  isActive(route) {
    return route === this.$location.path();
  }
}

export default angular.module('directives.navbar-admin', [])
  .component('navbar', {
    template: require('./navbar.html'),
    controller: NavbarComponent
  })
  .name;
