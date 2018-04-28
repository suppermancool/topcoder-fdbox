'use strict';

import angular from 'angular';
import _ from 'lodash';
import ModalCtrl from '../modals/modalCtrl';

export class FooterComponent {
  constructor($route, $uibModal, $window) {
    'ngInject';

    this.$route = $route;
    this.$uibModal = $uibModal;
    this.$window = $window;
  }

  openTerms() {
    this.$uibModal.open({
      template: require('../modals/terms.html'),
      controller: ModalCtrl,
      controllerAs: '$ctrl',
      windowClass: 'site-modal',
      size: 'lg',
      resolve: {
        modalOpts: () => ({
          redirect: this.$route
        })
      }
    }).result.then(_.noop, _.noop);
  }

  openPrivacy() {
    this.$uibModal.open({
      template: require('../modals/privacy.html'),
      controller: ModalCtrl,
      controllerAs: '$ctrl',
      windowClass: 'site-modal',
      size: 'lg',
      resolve: {
        modalOpts: () => ({
          redirect: this.$route
        })
      }
    }).result.then(_.noop, _.noop);
  }

  openImprint() {
    this.$uibModal.open({
      template: require('../modals/imprint.html'),
      controller: ModalCtrl,
      controllerAs: '$ctrl',
      windowClass: 'site-modal',
      size: 'lg',
      resolve: {
        modalOpts: () => ({
          redirect: this.$route
        })
      }
    }).result.then(_.noop, _.noop);
  }

  openFaq() {
    this.$uibModal.open({
      template: require('../modals/faq.html'),
      controller: ModalCtrl,
      controllerAs: '$ctrl',
      windowClass: 'site-modal',
      size: 'lg',
      resolve: {
        modalOpts: () => ({
          redirect: this.$route
        })
      }
    }).result.then(_.noop, _.noop);
  }

  goTo(...args) {
    let url = args.shift();
    let target = args.shift() || '_self';
    this.$window.open(url, target);
  }
}

export default angular.module('directives.footer-admin', [])
  .component('footer', {
    template: require('./footer.html'),
    controller: FooterComponent
  })
  .name;
