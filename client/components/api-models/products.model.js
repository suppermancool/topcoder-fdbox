'use strict';

import angular from 'angular';

export default angular.module('fbdoxApp.api-models.products', [])
  .config($httpProvider => {
    'ngInject';

    const onHttpRequest = config => {
      if(!(config.method === 'POST' || config.method === 'PUT')) {
        return config;
      }

      // if data is custom class and has toJSON, call it
      let jsonData = config.data || {};
      if(jsonData.toJSON && typeof jsonData.toJSON === 'function') {
        jsonData = jsonData.toJSON();
      }

      // check if has file to upload
      let hasFileToUpload = false;
      angular.forEach(jsonData, val =>
        hasFileToUpload || (hasFileToUpload = val instanceof File)
      );

      if(!hasFileToUpload) {
        return config;
      }

      config.headers['Content-Type'] = undefined;
      return config;
    };

    $httpProvider.interceptors.push(() => ({request: onHttpRequest}));
  })
  .factory('Product', ProductsResource)
  .name;

function ProductsResource($resource) {
  'ngInject';

  const transformRequest = data => {
    if(!(data.file && data.file instanceof File)) {
      return angular.toJson(data);
    }

    let formData = new FormData();

    angular.forEach(data.toJSON(), (value, key) => {
      if(angular.isObject(value) && value.id) {
        value = value.id;
      }

      formData.append(key, value);
    });

    return formData;
  };

  let products = $resource('/api/products/:id/:controller', {
    id: '@id',
    controller: '@controller'
  }, {
    update: {method: 'PUT', transformRequest},
    create: {method: 'POST', transformRequest},
    query: {method: 'GET', isArray: false},
  });

  products.prototype.$save = function() {
    let {category} = this;

    if(category) {
      this.category = category.id;
    }

    return this[this.id ? '$update' : '$create']()
      .catch(err => {
        this.category = category;
        return Promise.reject(err.data);
      });
  };

  return products;
}
