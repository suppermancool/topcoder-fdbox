'use strict';

const angular = require('angular');
const config = require('./config');
import ModalCtrl from '../modals/modalCtrl';
import _ from 'lodash';

export class LandingPage {
  constructor($location, Category, $uibModal) {
    'ngInject';

    this.$location = $location;
    this.activeSlide = 0;
    this.slideInterval = 3000;
    this.Category = Category;
    this.slides = [];
    this.monthlyFee = config.monthlyFee;
    this.purchaseFee = config.purchaseFee;
    this.$uibModal = $uibModal;
  }

  $onInit() {
    this.Category.query().$promise.then(res => {
      let displayedCategories = res.data;
      this.slides = displayedCategories.reduce(
        (acc, category, index) => {
          let maxCategoryPerSlide = 4;
          let slideIndex = Math.floor(index / maxCategoryPerSlide);
          acc[slideIndex] = [].concat(acc[slideIndex] || [], category);

          return acc;
        },
        []
      );
    });
  }

  openFaq() {
    this.$uibModal.open({
      template: require('../modals/faq.html'),
      controller: ModalCtrl,
      controllerAs: '$ctrl',
      windowClass: 'site-modal',
      size: 'lg',
      resolve: {
        modalOpts: () => {}
      }
    }).result.then(_.noop, _.noop);
  }

  goTo(item) {
    this.$location.path('/products').search('cat', item.title);
  }

  openProduct() {
    this.$location.path('/products');
  }
}

export default angular.module('fbdoxApp.landingPage', [])
  .component('landingPage', {
    template: require('./landing-page.html'),
    controller: LandingPage,
  })
  .name;
