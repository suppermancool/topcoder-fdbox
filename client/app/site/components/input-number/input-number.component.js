'use strict';

import angular from 'angular';

export class InputNumberComponent {}

export default angular.module('fbdoxApp.interviewTypes.inputNumber', [])
  .component('inputNumber', {
    template: require('./input-number.html'),
    controller: InputNumberComponent,
    bindings: {
      label: '@',
      tooltip: '@',
      name: '@',
      model: '='
    }
  })
  .name;
