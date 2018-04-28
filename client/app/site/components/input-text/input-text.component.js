'use strict';

import angular from 'angular';

export class InputTextComponent {
}

export default angular.module('fbdoxApp.interviewTypes.inputText', [])
  .component('inputText', {
    template: require('./input-text.html'),
    controller: InputTextComponent,
    bindings: {
      label: '@',
      tooltip: '@',
      name: '@',
      model: '='
    }
  })
  .directive('autoFocus', ['$timeout', $timeout => ({
    restrict: 'AC',
    link: (scope, element) => {
      $timeout(() => {
        element[0].focus();
      }, 0);
    },
  })])
  .directive('autoScroll', ['$window', '$document', ($window, $document) => ({
    restrict: 'AC',
    link: (scope, element) => {
      element.bind('focus', () => {
        let offsetTop = element[0].getBoundingClientRect().top;
        let clientHeight = $document[0].documentElement.clientHeight;
        let eHeight = element[0].offsetHeight + 40;
        let scrollY = $window.scrollY;
        let scr = offsetTop + scrollY + eHeight - clientHeight;
        $window.scrollTo(0, scr);
      });
    },
  })])
  .name;
