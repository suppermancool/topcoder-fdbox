'use strict';

const angular = require('angular');
import _ from 'lodash';
import {saveAs} from 'file-saver';

export class ProfilePage {
  constructor($uibModal, Auth, StripeCheckout, Product, Modal, appConfig, constants, $rootScope, $translate, $http, $location, User, Stripe) {
    'ngInject';

    this.$uibModal = $uibModal;
    this.sortPropertyName = 'username';
    this.sortReverse = false;
    this.paginationPageNumm = 1;
    this.strip = 1;
    this.paginationPageSize = 8;
    this.User = User;
    this.Auth = Auth;
    this.stripe = Stripe;
    this.StripeCheckout = StripeCheckout;
    this.$http = $http;
    this.Modal = Modal;
    this.constants = constants;
    this.defaultSubscriptionPlan = appConfig.subscriptionPlans[appConfig.defaultSubscriptionPlan];
    this.$translate = $translate;
    this.accounts = [];
    this.generatingPDF = [];
    this.$location = $location;
    this.$rootScope = $rootScope;
    // set up for stripe info
    this.newStripeToken = null;
    // Listen for stripe token updates
    $rootScope.$on('StripeCheckoutToken', (e, token) => {
      this.updatePaymentApi(token);
    });

    this.invoices = [];
    this.interviews = [];
  }

  $onInit() {
    this.Auth.getCurrentUserNow().then(info => {
      this.accountInfo = info;
      this.Auth.refreshCurrentUser(info);
      // determine account type
      if(this.accountInfo.role === this.constants.ENTERPRISE_USER) {
        this.accountInfo.isAdmin = false;
        this.accountInfo.isEnterprise = false;
        this.$translate('ENTEPRISE_USER').then(entUserType => {
          this.accountInfo.accountType = entUserType;
        });
        this.accountInfo.company = this.accountInfo.enterprise.company || null;
        this.accountInfo.address = this.accountInfo.enterprise.address || null;
        this.accountInfo.postcode = this.accountInfo.enterprise.postcode || null;
        this.accountInfo.vatNumber = this.accountInfo.enterprise.vatNumber || null;
        this.accountInfo.city = this.accountInfo.enterprise.city || null;
        this.accountInfo.preferences.standardFontName = this.accountInfo.enterprise.preferences.standardFontName || null;
        this.accountInfo.preferences.standardFontSize = this.accountInfo.enterprise.preferences.standardFontSize || null;
      } else if(this.accountInfo.role === this.constants.ADMIN) {
        this.accountInfo.isAdmin = true;
        this.accountInfo.isEnterprise = false;
        this.$translate('ADMIN').then(admin => {
          this.accountInfo.accountType = admin;
        });
      } else {
        this.accountInfo.isAdmin = false;
        this.accountInfo.isEnterprise = true;
        this.$translate('MULTI_ACCOUNT').then(multiType => {
          this.accountInfo.accountType = multiType;
        });
      }
      // Load enterprise accounts if needed
      if(this.accountInfo.role === this.constants.ENTERPRISE) {
        this.User.getMembers({id: this.accountInfo.id}).$promise
        .then(members => {
          this.accounts = members.data;
        });
      }
    });

    // Load invoices
    this.$http.get('/api/invoices', { customerId: this.Auth.getCurrentUserSync().id })
    .then(res => {
      _.each(res.data, inv => {
        this.invoices.push({
          id: inv.id,
          type: 'subscription',
          username: inv.customer.description,
          title: inv.subscription.plan.name,
          date: new Date(inv.date * 1000)
        });
      });

      // Load order invoices
      this.$http.get('api/order/invoices', { customerId: this.Auth.getCurrentUserSync().id })
        .then(r => {
          _.each(r.data, inv => {
            this.invoices.push({
              id: inv.id,
              type: 'sku',
              username: inv.customer.description,
              title: inv.items[0].description,
              date: new Date(inv.created * 1000)
            });
          });
        })
        .catch(e => {
          this.paymentProcessing = false;
          console.error(e);
        });
    })
    .catch(e => {
      this.paymentProcessing = false;
      console.error(e);
    });

    // Load interviews
    this.$http.get('/api/interviews', { user: this.Auth.getCurrentUserSync().id })
    .then(res => {
      _.each(res.data, interview => {
        this.interviews.push({
          id: interview._id,
          companyName: interview.details.FIRMA,
          title: interview.product.title,
          date: new Date(interview.updatedAt)
        });
      });
    })
    .catch(e => {
      console.error(e);
    });
  }
  /**
   * Download the PDF invoice
   */
  downloadInvoice(id, type, index) {
    this.generatingPDF[index] = true;
    let url;
    if(type === 'sku') {
      url = `/api/order/invoices/${id}/pdf`;
    } else if(type === 'subscription') {
      url = `/api/invoices/${id}/pdf`;
    }

    this.$http.get(url, { responseType: 'arraybuffer' })
    .then(res => {
      saveAs(new Blob([res.data], { type: 'application/pdf' }), 'Rechnung.pdf');

      this.generatingPDF[index] = false;
    });
  }
  /**
   * resume saved interview
   */
  resumeInterview(id) {
    this.$location.path(`/products/${id}`);
  }
  /**
  * Delete interview
  */
  deleteInterview(interview) {
    this.Modal.confirm.delete(`${interview.companyName} (${interview.title})`)
      .then(() => {
        this.$http.delete(`/api/interviews/${interview.id}`);
      })
      .then(() => {
        _.remove(this.interviews, {id: interview.id});
      })
      .catch(angular.noop);
  }
     /**
   * Delete interview
   */
  deleteAllInterviews() {
    this.Modal.confirm.delete('alle produkte')
      .then(() => {
        this.$http.delete('/api/interviews');
      })
      .then(() => {
        this.interviews = [];
      })
      .catch(angular.noop);
  }
  /**
   * Change User Pass
   */
  updatePass() {
    this.passwordUpdateError = null;
    this.passwordUpdated = false;
    this.Auth.changePassword(this.oldPassword, this.newPassword)
    .then(() => {
      this.passwordUpdated = true;
      this.oldPassword = '';
      this.newPassword = '';
      this.confirmPassword = '';
    })
    .catch(e => {
      this.passwordUpdateError = e.statusText;
      console.error(e);
    });
  }
  /**
   * Update account info
   */
  saveAccountUpdates() {
    if(this.accountInfo.role === this.constants.ENTERPRISE_USER) {
      this.$translate('UNPRIV_ERROR').then(err => {
        this.profileUpdateError = err.data.message;
      });
      return;
    }
    this.profileUpdateOK = false;
    this.profileUpdateError = '';
    this.accountInfo.account = {
      stripeSource: '28T12'
    };
    this.Auth.updateMe(this.accountInfo)
    .then(() => {
      this.profileUpdateOK = true;
    })
    .catch(err => {
      console.error(err);
      this.profileUpdateError = err.data.errors[Object.keys(err.data.errors)[0]].message;
    });
  }
  /**
   * Sort enterprise sub users table
   */
  sortBy(propertyName) {
    this.sortReverse = this.sortPropertyName === propertyName ? !this.sortReverse : false;
    this.sortPropertyName = propertyName;
  }
  /**
   * Delete enterprise sub user
   */
  deleteAccount(account) {
    this.Modal.confirm.delete(`${account.fname} ${account.lname} (${account.email})`)
      .then(() => this.User.remove({id: account.id}))
      .then(() => {
        _.remove(this.accounts, {id: account.id});
      })
      .catch(angular.noop);
  }
  /**
   * Open create/update enterprise sub user modal
   */
  createUpdateAccount(account) {
    this.$uibModal.open({
      template: require('../modals/createUpdateAccount.html'),
      controller: AccountModalCtrl,
      controllerAs: '$ctrl',
      windowClass: 'site-modal',
      backdrop: 'static',
      resolve: {
        account: () => account ? angular.copy(account) : {},
        enterprise: () => this.accountInfo.id
      }
    }).result.then(user => {
      if(!account) {
        this.accounts.push(user);
      } else {
        this.accounts[_.findIndex(this.accounts, {id: user.id})] = user;
      }
    }, _.noop);
  }
  /**
   * Manage Payment Method
   */
  stripeCheckout() {
    this.StripeCheckout.open({
      name: this.defaultSubscriptionPlan.name,
      amount: this.defaultSubscriptionPlan.amount,
      currency: this.defaultSubscriptionPlan.currency,
      panelLabel: 'Subscribe, Pay {{amount}}',
      email: this.accountInfo.email
    });
  }
  // Common SetOutcome Function
  setOutcome(result) {
    this.paymentUpdateOK = false;
    this.paymentUpdateError = null;
    if(result.token) {
      // Use the token to create a charge or a customer
      this.newStripeToken = result.token;
      this.paymentUpdateOK = true;
    } else if(result.error) {
      this.paymentUpdateError = result.error.message;
    }
    this.$rootScope.$evalAsync();
  }
  /**
   * Prepare Before Update Payment Method
   */
  prepareBeforeUpdatePayment() {
    this.$rootScope.$broadcast('StripeCreateToken');
  }
  /**
   * Update Payment Method
   */
  updatePayment() {
    if(this.newStripeToken !== null) {
      this.$rootScope.$emit('StripeCheckoutToken', this.newStripeToken);
    }
  }
  /**
   * Call api for Update Payment Method
   */
  updatePaymentApi(token) {
    this.accountInfo.account.stripeSource = token.id;
    this.Auth.updateMe({
      account: {
        stripeSource: token.id
      }
    })
    .then(() => {
      this.paymentUpdateOK = true;
      this.paymentUpdateError = null;
    })
    .catch(err => {
      console.error(err);
      this.paymentUpdateError = err.statusText;
    });
  }
}

class AccountModalCtrl {
  constructor($uibModalInstance, account, User, constants, enterprise) {
    'ngInject';

    this.enterprise = enterprise;
    this.accountForm = account;
    this.modal = $uibModalInstance;
    this.user = new User({
      enterprise,
      role: constants.ENTERPRISE_USER
    });
  }
  /**
   * Create/update enterprise sub user
   */
  createUpdateAccount() {
    let p;

    if(this.working) {
      return;
    }

    this.working = true;
    this.error = '';

    _.merge(this.user, this.accountForm);

    if(this.accountForm.id) {
      // UPDATE
      p = this.user.$update();
    } else {
      // CREATE
      p = this.user.$save();
    }
    p.then(user => {
      this.working = false;
      this.modal.close(user);
    })
    .catch(err => {
      console.error(err);
      this.error = err.data.errors[Object.keys(err.data.errors)[0]].message;
      this.working = false;
    });
  }
}

export default angular.module('fbdoxApp.profilePage', [])
  .component('profilePage', {
    template: require('./profile-page.html'),
    controller: ProfilePage,
  })
  .name;
