'use strict';
import angular from 'angular';

export default angular.module('fbdoxApp.admin-layout', [])
  .directive('adminLayout', () => ({
    template: require('./admin-layout.html'),
    restrict: 'EA',
    transclude: true,
  }))
  .name;
