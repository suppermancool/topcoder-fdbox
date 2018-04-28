'use strict';

export default function routes($routeProvider) {
  'ngInject';

  $routeProvider.when('/admin', {
    redirectTo: '/admin/users',
  })

  // manage users routes
  .when('/admin/users', {
    template: '<users></users>',
    authenticate: 'admin',
    resolve: {
      auth: (Auth, $location, $q) => {
        let defer = $q.defer();
        Auth.isAdmin().then(admin => {
          if(admin) {
            defer.resolve();
          } else {
            defer.reject('not_admin');
          }
        });
        return defer.promise;
      }
    }
  })
  .when('/admin/users/:userId', {
    template: '<user></user>',
    authenticate: 'admin',
    resolve: {
      auth: (Auth, $location, $q) => {
        let defer = $q.defer();
        Auth.isAdmin().then(admin => {
          if(admin) {
            defer.resolve();
          } else {
            defer.reject('not_admin');
          }
        });
        return defer.promise;
      }
    }
  })

  // manage products routes
  .when('/admin/products', {
    template: '<products></products>',
    authenticate: 'admin',
    resolve: {
      auth: (Auth, $location, $q) => {
        let defer = $q.defer();
        Auth.isAdmin().then(admin => {
          if(admin) {
            defer.resolve();
          } else {
            defer.reject('not_admin');
          }
        });
        return defer.promise;
      }
    }
  })
  .when('/admin/products/add', {
    template: '<product></product>',
    authenticate: 'admin',
    resolve: {
      auth: (Auth, $location, $q) => {
        let defer = $q.defer();
        Auth.isAdmin().then(admin => {
          if(admin) {
            defer.resolve();
          } else {
            defer.reject('not_admin');
          }
        });
        return defer.promise;
      }
    }
  })
  .when('/admin/products/:productId', {
    template: '<product></product>',
    authenticate: 'admin',
    resolve: {
      auth: (Auth, $location, $q) => {
        let defer = $q.defer();
        Auth.isAdmin().then(admin => {
          if(admin) {
            defer.resolve();
          } else {
            defer.reject('not_admin');
          }
        });
        return defer.promise;
      }
    }
  })

  // manage categories routes
  .when('/admin/categories', {
    template: '<categories></categories>',
    authenticate: 'admin',
    resolve: {
      auth: (Auth, $location, $q) => {
        let defer = $q.defer();
        Auth.isAdmin().then(admin => {
          if(admin) {
            defer.resolve();
          } else {
            defer.reject('not_admin');
          }
        });
        return defer.promise;
      }
    }
  })
  .when('/admin/categories/add', {
    template: '<category></category>',
    authenticate: 'admin',
    resolve: {
      auth: (Auth, $location, $q) => {
        let defer = $q.defer();
        Auth.isAdmin().then(admin => {
          if(admin) {
            defer.resolve();
          } else {
            defer.reject('not_admin');
          }
        });
        return defer.promise;
      }
    }
  })
  .when('/admin/categories/:categoryId', {
    template: '<category></category>',
    authenticate: 'admin',
    resolve: {
      auth: (Auth, $location, $q) => {
        let defer = $q.defer();
        Auth.isAdmin().then(admin => {
          if(admin) {
            defer.resolve();
          } else {
            defer.reject('not_admin');
          }
        });
        return defer.promise;
      }
    }
  })
  // manage messages routes
  .when('/admin/messages', {
    template: '<messages></messages>',
    authenticate: 'admin',
    resolve: {
      auth: (Auth, $location, $q) => {
        let defer = $q.defer();
        Auth.isAdmin().then(admin => {
          if(admin) {
            defer.resolve();
          } else {
            defer.reject('not_admin');
          }
        });
        return defer.promise;
      }
    }
  })
  .when('/admin/messages/add', {
    template: '<message></message>',
    authenticate: 'admin',
    resolve: {
      auth: (Auth, $location, $q) => {
        let defer = $q.defer();
        Auth.isAdmin().then(admin => {
          if(admin) {
            defer.resolve();
          } else {
            defer.reject('not_admin');
          }
        });
        return defer.promise;
      }
    }
  })
  .when('/admin/messages/:messageId', {
    template: '<message></message>',
    authenticate: 'admin',
    resolve: {
      auth: (Auth, $location, $q) => {
        let defer = $q.defer();
        Auth.isAdmin().then(admin => {
          if(admin) {
            defer.resolve();
          } else {
            defer.reject('not_admin');
          }
        });
        return defer.promise;
      }
    }
  });
}
