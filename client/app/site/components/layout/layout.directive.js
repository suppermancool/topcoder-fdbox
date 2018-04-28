'use strict';
import angular from 'angular';

export default angular.module('fbdoxApp.site-layout', [])
  .directive('siteLayout', () => ({
    template: require('./site-layout.html'),
    restrict: 'EA',
    transclude: true,
  }))
  .name;
