'use strict';

import _ from 'lodash';

export default class ModalCtrl {
  constructor($uibModalInstance, Auth, $location, $route, $uibModal, appConfig, $scope, $http, $window, modalOpts, Stripe, $sce) {
    'ngInject';

    this.modal = $uibModalInstance;
    this.Auth = Auth;
    this.$location = $location;
    modalOpts = modalOpts ? modalOpts : {};
    this.redirect = modalOpts.redirect || null;
    this.$route = $route;
    this.$uibModal = $uibModal;
    this.$http = $http;
    this.defaultSubscriptionPlan = appConfig.subscriptionPlans[appConfig.defaultSubscriptionPlan];
    this.registerForm = {};
    this.$window = $window;
    this.modalSwitchToggle = modalOpts.modalSwitchToggle || false;
    this.regPayment = false;
    this.scope = $scope;
    this.stripe = Stripe;
    this.errorMsg = '';
    this.stripeError = false;
    this.stripeSuccess = false;
    this.stripeCardIsValid = false;
    this.stripeProcessing = false;
    this.messageText = $sce.trustAsHtml(modalOpts.messageText) || '';
  }
  /**
   * login user
   */
  login() {
    this.Auth.login({email: this.loginForm.email, password: this.loginForm.password}).then(() => {
      if(this.redirect && _.isFunction(this.redirect.reload)) {
        this.redirect.reload();
      } else if(this.redirect) {
        this.$window.location.reload(true);
      }
      this.modal.close();
    })
    .catch(err => {
      this.error = err.message;
    });
  }
  /**
   * register user
   */
  register() {
    this.registering = true;
    this.stripeProcessing = false;
    this.error = null;
    this.Auth.createUser(this.registerForm)
      .then(() => {
        this.registering = false;
        if(this.redirect && _.isFunction(this.redirect.reload)) {
          this.redirect.reload();
        } else if(this.redirect) {
          this.$window.location.reload(true);
        }
        this.modal.close();
      })
      .catch(err => {
        console.error(err);
        this.error = err.statusText;
        this.registering = false;
        this.regPayment = false;
      });
  }

  /**
   * send random password to user email
   */
  resetPassword() {
    let that = this;
    this.$http.put('/api/users/me/password/reset', { email: this.loginForm.email})
      .then(res => {
        console.log(res);
        that.modal.close();
      })
      .catch(e => {
        console.error(e);
        that.modal.close();
      });
  }

  /**
   * open reset password modal
   */
  resetPopup() {
    this.modal.close();
    this.$uibModal.open({
      template: require('./reset.html'),
      controller: ModalCtrl,
      controllerAs: '$ctrl',
      windowClass: 'site-modal',
      resolve: {
        modalOpts: () => ({
          redirect: this.$route
        })
      }
    }).result.then(_.noop, _.noop);
  }

  /**
   * Open terms in register popup
   */
  openTermInRegister() {
    let modal = document.querySelector('.modal');
    modal.style.display = 'none';
    this.$uibModal.open({
      template: require('./terms.html'),
      controller: ModalCtrl,
      controllerAs: '$ctrl',
      windowClass: 'site-modal',
      size: 'lg',
      resolve: {
        modalOpts: () => ({
          redirect: this.$route
        })
      }
    }).result.then(() => {
      modal.style.display = 'block';
    }, () => {
      modal.style.display = 'block';
    });
  }

  openPrivacyInRegister() {
    let modal = document.querySelector('.modal');
    modal.style.display = 'none';
    this.$uibModal.open({
      template: require('./privacy.html'),
      controller: ModalCtrl,
      controllerAs: '$ctrl',
      windowClass: 'site-modal',
      size: 'lg',
      resolve: {
        modalOpts: () => ({
          redirect: this.$route
        })
      }
    }).result.then(() => {
      modal.style.display = 'block';
    }, () => {
      modal.style.display = 'block';
    });
  }
  toggleModals() {
    this.error = false;
    this.modalSwitchToggle = !this.modalSwitchToggle;
  }

  // Form Submit Button Click
  submitCard() {
    if(this.registerForm.stripeSource) {
      this.register();
      return;
    } else if(!this.stripeCardIsValid || this.stripeProcessing) {
      return;
    }
    this.stripeProcessing = true;
    this.stripeError = false;
    this.scope.$broadcast('StripeCreateToken');
  }
  // Common SetOutcome Function
  setOutcome(result) {
    this.stripeError = false;
    if(result.complete) {
      this.stripeCardIsValid = true;
    } else {
      this.stripeCardIsValid = false;
    }
    if(result.token) {
      // Use the token to create a charge or a customer
      this.registerForm.stripeSource = result.token.id;
      this.stripeSuccess = true;
      this.stripeProcessing = true;
    } else if(result.error) {
      this.errorMsg = result.error.message;
      this.stripeError = true;
      this.stripeProcessing = false;
    }
    this.scope.$evalAsync();
  }

  checkContinue(ev, form) {
    if(ev.which === 13 && form.$valid) {
      ev.preventDefault();
      this.regPayment = true;
    }
  }
  checkSubmit(form1, form2) {
    if(form1.$valid && form2.$valid && !this.registering && (this.stripeCardIsValid || this.stripeSuccess) && !this.stripeProcessing) {
      this.submitCard();
    }
  }
}
