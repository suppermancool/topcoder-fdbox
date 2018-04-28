import angular from 'angular';

export class FooterComponent {}

export default angular.module('directives.footer-admin', [])
  .component('footer', {
    template: require('./footer.html'),
    controller: FooterComponent
  })
  .name;
