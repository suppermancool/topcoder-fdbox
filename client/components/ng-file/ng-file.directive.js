'use strict';
const angular = require('angular');

export default angular.module('fbdoxApp.ng-file', [])
  .directive('ngFile', () => ({
    restrict: 'A',
    require: 'ngModel',
    scope: {
      ngModel: '=',
      fileChange: '&'
    },
    link: ($scope, el) => {
      el.bind('change', event => $scope.$applyAsync(() => {
        $scope.ngModel = event.target.files[0];
        $scope.fileChange();
      }));
    }
  }))
  .name;
