'use strict';
/* eslint no-sync: 0 */

import angular from 'angular';

export class SpinnerComponent {
}

export default angular.module('directives.spinner', [])
  .component('spinner', {
    template: require('./spinner.html'),
    controller: SpinnerComponent
  })
  .name;
