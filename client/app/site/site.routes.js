'use strict';

export default function routes($routeProvider) {
  'ngInject';

  // landing page
  $routeProvider.when('/', {
    template: '<landing-page></landing-page>',
  });
  // products page
  $routeProvider.when('/products', {
    template: '<products-page></products-page>'
  });
  // products page
  $routeProvider.when('/products/:idInterview', {
    template: '<products-page></products-page>'
  });
  // profile page
  $routeProvider.when('/profile', {
    template: '<profile-page></profile-page>',
    authenticate: true
  });
}
