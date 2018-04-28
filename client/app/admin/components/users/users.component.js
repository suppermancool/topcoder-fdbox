'use strict';
const angular = require('angular');
import _ from 'lodash';
import { saveAs } from 'file-saver';
import moment from 'moment';

export class UserComponent {
  /*@ngInject*/
  constructor($routeParams, User, appConfig, Modal, $location, $http) {
    this.User = User;
    this.$http = $http;
    this.userId = $routeParams.userId;
    this.billingDiscounts = _.concat(
      {title: 'None', value: undefined},
      appConfig.billingDiscounts
    );
    this.Modal = Modal;
    this.$location = $location;
    this.loading = false;
  }

  $onInit() {
    // Use the User $resource to fetch users
    if(this.userId) {
      return this.User.get({id: this.userId}).$promise.then(u => {
        u.account.billingDiscount = u.account.billingDiscount;
        this.user = u;
      });
    } else if(this.$location.$$path === '/admin/users/add') {
      this.user = new this.User();
      return;
    }

    this.loading = true;
    this.User.query()
      .$promise.then(users => {
        this.users = users;
      // Load invoices
        this.$http.get('/api/invoices', { customerId: this.userId})
          .then(subscription => {
            // Load order invoices
            this.$http.get('api/order/invoices', { customerId: this.userId })
              .then(sku => {
                this.composeInvoiceData(subscription.data, sku.data, users);
                this.loading = false;
              })
              .catch(e => {
                this.loading = false;
                console.error(e);
              });
          })
          .catch(e => {
            this.loading = false;
            console.error(e);
          });
      });

    this.composeInvoiceData = (subscription, sku, users) => {
      _.each(users.data, user => {
        user.invoices = [];
        _.each(subscription, inv => {
          if(user.email === inv.customer.email) {
            user.invoices.push({
              invoiceId: inv.id,
              title: inv.subscription.plan.name,
              type: 'subscription'
            });
          }
        });
      });
      _.each(users.data, user => {
        _.each(sku, inv => {
          if(user.email === inv.customer.email) {
            user.invoices.push({
              invoiceId: inv.id,
              title: inv.items[0].description,
              type: 'sku'
            });
          }
        });
      });
    };
  }

  /**
   * Download the PDF invoice
   */
  downloadInvoice(id, type) {
    this.generatingPDF = true;
    let url;
    if(type === 'sku') {
      url = `/api/order/invoices/${id}/pdf`;
    } else if(type === 'subscription') {
      url = `/api/invoices/${id}/pdf`;
    }

    this.$http.get(url, { responseType: 'arraybuffer' })
      .then(res => {
        saveAs(new Blob([res.data], { type: 'application/pdf' }), 'Rechnung.pdf');

        this.generatingPDF = false;
      });
  }

  /**
   * Update user
   */
  upateUser(user) {
    this.working = true;
    this.profileUpdateError = '';
    let p;
    if(user.id) {
      p = user.$update();
    } else {
      p = user.$save();
    }
    p
    .then(() => this.$location.path('/admin/users'))
    .catch(e => {
      this.working = false;
      this.profileUpdateError = e.statusText;
    });
  }
  /**
   * Delete user
   */
  deleteUser(user) {
    this.Modal.confirm.delete(user.email)
    .then(() => user.$remove())
    .then(() => this.$location.path('/admin/users'))
    .catch(e => {
      this.profileUpdateError = e.statusText;
    });
  }
  /**
   * Check if valid date range for zip API
   */
  isValidDateRange() {
    if(!this.dateStart || !this.dateEnd) {
      return false;
    }
    const startDate = moment(this.dateStart).unix();
    const endDate = moment(this.dateEnd).unix();
    if(startDate > endDate) {
      return false;
    }
    return true;
  }
  /**
   * Download zip file of invoices from specified date range
   */
  downloadInvoicesZip() {
    if(!this.isValidDateRange() || this.generatingZip) {
      return;
    }
    const startDate = moment(this.dateStart).unix();
    const endDate = moment(this.dateEnd).unix() + 86399; //the end of selected date in unix time

    this.generatingZip = true;
    let url = `/api/customer/invoices/${startDate}/${endDate}/zip`;

    this.$http.get(url, { responseType: 'arraybuffer' })
      .then(res => {
        const sDate = moment.unix(startDate).utc()
          .format('YYYY-MM-DD');
        const eDate = moment.unix(endDate).utc()
          .format('YYYY-MM-DD');
        saveAs(new Blob([res.data], { type: 'application/zip' }), `invoices_${sDate}_${eDate}.zip`);
        this.generatingZip = false;
      })
      .catch(error => {
        this.generatingZip = false;
        this.Modal.confirm.warn(error.statusText || 'Unable to retrieve invoices');
      });
  }
}

export default angular.module('fbdoxApp.user', [])
  .component('users', {
    template: require('./users.html'),
    controller: UserComponent,
  })
  .component('user', {
    template: require('./user-details.html'),
    controller: UserComponent,
  })
  .name;
