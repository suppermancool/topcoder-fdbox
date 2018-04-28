'use strict';

import angular from 'angular';
import _ from 'lodash';

export class InputSelectComponent {
  onChange() {
    const s = _.find(this.options, o => o.attrs.name == this.model);
    _.chain(this.attrs)
      .pickBy((v, k) => k[0] == 'v' && k[1] == 'a' && k[2] == 'r')
      .each((v, k) => {
        if(s) {
          this.interview[v] = s.attrs[`result${k[k.length - 1]}`];
        }
      })
      .value();
  }

  $onInit() {
    this.onChange();
  }
}

export default angular.module('fbdoxApp.interviewTypes.inputSelect', []).component('inputSelect', {
  template: require('./input-select.html'),
  controller: InputSelectComponent,
  bindings: {
    label: '@',
    tooltip: '@',
    name: '@',
    model: '=',
    interview: '<',
    attrs: '<',
    options: '<'
  }
}).name;
