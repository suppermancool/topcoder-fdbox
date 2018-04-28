'use strict';

export function CategoriesResource($resource) {
  'ngInject';


  let categories = $resource('/api/categories/:id/:controller', {
    id: '@id'
  }, {
    update: {method: 'PUT'},
    create: {method: 'POST'},
    query: {method: 'GET', isArray: false},
  });

  categories.prototype.$save = function() {
    return this[this.id ? '$update' : '$create']();
  };

  return categories;
}
