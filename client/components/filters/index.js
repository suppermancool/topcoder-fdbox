'use strict';

import angular from 'angular';
import _ from 'lodash';

function startFrom() {
  return function(input, start) {
    start = +start;
    return input.slice(start);
  };
}

function catsFilter() {
  /**
   * Filters by cat title and selection
   * @param  {Array} input
   * @param  {Array} cats
   * @return {Array} Result
   */
  return function(input, cats) {
    return _.filter(input, p => _.findIndex(cats, {
      title: p.category.title,
      selected: true
    }) != -1);
  };
}

export default angular.module('fbdoxApp.filters', [])
  .filter('startFrom', startFrom)
  .filter('catsFilter', catsFilter)
  .name;
