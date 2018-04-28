
'use strict';

import angular from 'angular';

const clickOutSide = ($window, $parse) => ({
  link: (scope, el, attr) => {
    if(!attr.twClickOutside) {
      return;
    }

    let ignore;
    if(attr.ignoreIf) {
      ignore = $parse(attr.ignoreIf);
    }

    let nakedEl = el[0];
    let fn = $parse(attr.twClickOutside);

    let handler = function(e) {
      if(nakedEl === e.target || nakedEl.contains(e.target) || ignore && ignore(scope)) {
        return;
      }

      scope.$apply(fn);
    };

    $window.addEventListener('click', handler, true);

    scope.$on('$destroy', () => {
      $window.removeEventListener('click', handler);
    });
  }
});

export default angular.module('tw.directives.clickOutside', []).directive('twClickOutside', ['$window', '$parse', clickOutSide]).name;
