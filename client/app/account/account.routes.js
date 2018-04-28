'use strict';

export default function routes($routeProvider) {
  'ngInject';

  $routeProvider.when('/login', {
    template: require('./login/login.html'),
    controller: 'LoginController',
    controllerAs: 'vm'
  })
    .when('/logout', {
      name: 'logout',
      referrer: '/',
      template: '',
      controller($route, Auth, $window) {
        const referrer = $route.current.params.referrer || $route.current.referrer || '/';
        Auth.logout();
        $window.location.href = referrer;
      }
    })
    .when('/signup', {
      template: require('./signup/signup.html'),
      controller: 'SignupController',
      controllerAs: 'vm'
    })
    .when('/settings', {
      template: require('./settings/settings.html'),
      controller: 'SettingsController',
      controllerAs: 'vm',
      authenticate: true
    });
}
