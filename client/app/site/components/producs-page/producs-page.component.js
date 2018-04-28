'use strict';

const angular = require('angular');
import _ from 'lodash';
import ModalCtrl from '../modals/modalCtrl';
import moment from 'moment';

export class ProducsPage {
  constructor($http, $rootScope, $route, $routeParams, $translate, Auth, $uibModal, Util, $location, Category, Product, $timeout, $cookies, appConfig, constants, $window) {
    'ngInject';

    this.$timeout = $timeout;
    this.$http = $http;
    this.Category = Category;
    this.Product = Product;
    this.$routeParams = $routeParams;
    this.$route = $route;
    this.$location = $location;
    this.$rootScope = $rootScope;
    this.$translate = $translate;
    this.Auth = Auth;
    this.$uibModal = $uibModal;
    this.util = Util;
    this.activeStep = 1;
    this.activeSectionCnt = 1;
    this.doneSteps = {
      1: false,
      2: false,
      3: false,
      4: false
    };
    this.doneSections = {};
    this.progress = 23.5;
    this.paginationPageNumm = 1;
    this.paginationPageSize = 10;
    this.filteredProducts = [];
    this.sortPropertyName = 'description';
    this.sortReverse = false;
    this.products = [];
    this.cats = [];
    this.categoryRowIndices = [];
    this.interviewForm = {};

    this.loading = false;
    this.selectFields = {};
    this.allCatsFlag = false;
    this.filterHover = false;
    this.$cookies = $cookies;
    this.interviewF = false;
    this.selectedProduct = false;
    this.uploadPath = `${appConfig.uploads.public}/${appConfig.uploads.docs}`;
    this.constants = constants;
    this.$window = $window;
    this.idInterview = $routeParams.idInterview || '';
    this.newInterview = {};
    this.deregSaveLogout;
    this.deregisterListener;
    this.waitMsg = '';
  }

  $onInit() {
    if(this.idInterview) {
      this.activeStep = 2;
      this.getSavedInterview(this.idInterview).then(res => {
        this.selectProduct(res.data.product);
        _.merge(this.interviewForm, res.data.details);
        this.newInterview._id = this.idInterview;
      })
      .catch(e => {
        console.error(e);
        this.$location.path('/products');
      });
    } else {
      this.$translate('STEP1_TITLE').then(text => {
        this.activeTitle = text;
      });
    }

    this.Category.query().$promise.then(res => {
      let catQ;
      let c = -1;
      let numCatRows = 0;

      if(this.$routeParams.cat) {
        catQ = this.$routeParams.cat.toLowerCase();
        c = _.findIndex(res.data, _c => _c.title.toLowerCase() == catQ);
      }

      if(c !== -1) {
        this.cats = res.data.map(cat =>
          _.assign(cat, {
            selected: false
          })
        );
        this.cats[c].selected = true;
      } else {
        this.cats = res.data.map(cat =>
          _.assign(cat, {
            selected: true
          })
        );
        this.allCatsFlag = true;
      }

      numCatRows = Math.ceil(this.cats.length / 2);

      this.categoryRowIndices = _.range(numCatRows);
    });
    this.Product.query().$promise.then(res => {
      this.products = res.data;
    });

    this.deregisterListener = this.$rootScope.$on('$locationChangeStart', e => {
      let rt = this.$route.routes[this.$location.path()].originalPath;
      if(this.util.isInterviewProcess() && this.interviewF.$dirty && this.Auth.isLoggedInSync()) {
        e.preventDefault();
        this.newInterview.details = this.interviewForm;
        this.util.confirmBackInInterviewProcess(this.newInterview).then(check => {
          if(check) {
            this.interviewF.$setPristine();
            this.util.setInterviewProcess(false);
            this.$location.url(rt);
          }
        });
      }
    });

    this.deregSaveLogout = this.$rootScope.$on('saveLogout', () => {
      if(this.interviewF.$dirty) {
        this.newInterview.details = this.interviewForm;
        this.util.confirmBackInInterviewProcess(this.newInterview, true).then(res => {
          if(res) {
            this.interviewF.$setPristine();
          }
        });
      } else {
        this.Auth.logout();
        this.$location.path('/');
      }
    });
  }

  $onDestroy() {
    this.deregSaveLogout();
    this.deregisterListener();
  }
  /**
   * Clear search text
   */
  clearSearchText() {
    this.q = '';
  }
  /**
   * Filter by keywords
   * instead of single string text
   * @param  {Object} value Product
   * @return {Boolean} Result
   */
  byQ(value) {
    if(!this.q) {
      return true;
    }
    const keywords = this.q.split(' ');
    return keywords.every(element => value.description.toLowerCase().includes(element.toLowerCase()));
  }
  /**
   * Converts val to date
   * @params {String} val Value to convert
   * @returns {Date}
   */
  asDate(val) {
    return new Date(val || null);
  }
  /**
   * Check if question input has error
   * @params {Object} question The question
   * @params {Object} interviewF The form
   * @returns {Boolean}
   */
  hasError(question, interviewF) {
    return this.evalTests(question) || interviewF[question.attrs.var1].$invalid;
  }
  /**
   * Check if section is done
   * @param  {Object} interviewF The form
   * @return {Boolean} Result
   */
  isSectionDone(interviewF) {
    if(!this.interviewF) {
      this.interviewF = interviewF;
    }
    if(!this.selectedProduct || !this.selectedProduct.interview) {
      return;
    }
    const s = this.selectedProduct.interview.section[this.activeSection - 1];
    let dones = [];
    _.each(s.question, question => {
      dones.push(this.evalTests(question) || interviewF[question.attrs.var1] && interviewF[question.attrs.var1].$invalid);
    });
    dones = _.compact(dones);
    return dones.length === 0;
  }
  /**
   * Helper to convert end values
   * @param  {String | Date} varName The val to convert
   * @return {String} Result
   */
  safeVal(varName) {
    if(this.interviewForm[varName] instanceof Date) {
      return moment.utc(this.interviewForm[varName]).format('D.M.YYYY');
    }
    return this.interviewForm[varName];
  }
  /**
   * eval in context
   * @param  {String} toEval Exp to evaluate
   * @return {Mixed} Result
   */
  evalInContext(toEval) {
    return eval(toEval);
  }
  /**
   * eval if conditions
   * @param  {Object} entity
   * @return {Boolean} Result
   */
  evalConditions(entity) {
    const ifs = _.chain(entity.attrs)
      .pickBy((v, k) => k[0] == 'i' && k[1] == 'f')
      .values()
      .value();
    if(!ifs.length) {
      return true;
    }
    return this.evalInContext.call(this.interviewForm, `this.${ifs.join(' && this.')}`);
  }
  /**
   * eval tests
   * @param  {Object} entity
   * @return {Boolean} Result
   */
  evalTests(entity) {
    const tests = _.chain(entity.attrs)
      .pickBy((v, k) => k[0] == 't' && k[1] == 'e' && k[2] == 's' && k[3] == 't')
      .values()
      .value();
    if(!tests.length) {
      return false;
    }
    try {
      return this.evalInContext.call(this.interviewForm, `this.${tests.join(' && this.')}`);
    } catch(e) {
      return false;
    }
  }
  /**
   * eval statements
   * @param  {Object} attrs
   * @return {Mixed} Result
   */
  evalStatement(attrs) {
    const c = `this.${attrs.result1.split('+').join('+this.')}`;
    const e = this.evalInContext.call(this.interviewForm, c);
    this.interviewForm[attrs.var1] = e;
    return e;
  }
  /**
   * reset cats filter
   */
  resetCats() {
    this.cats = this.cats.map(cat =>
      _.assign(cat, {
        selected: true
      })
    );
    this.allCatsFlag = true;
  }
  /**
   * click on `All`
   */
  allCatsClick() {
    if(this.allCatsFlag) {
      this.cats = this.cats.map(cat =>
        _.assign(cat, {
          selected: true
        })
      );
    } else {
      this.cats = this.cats.map(cat =>
        _.assign(cat, {
          selected: false
        })
      );
    }
  }
  /**
   * Checker to see update `allCatsFlag`
   */
  updateAllCatsFlag() {
    if(_.every(this.cats, ['selected', true])) {
      this.allCatsFlag = true;
    } else {
      this.allCatsFlag = false;
    }
  }
  /**
   * sort table
   */
  sortBy(propertyName) {
    this.paginationPageNumm = 1;
    this.sortReverse = this.sortPropertyName === propertyName ? !this.sortReverse : false;
    this.sortPropertyName = propertyName;
  }
  true;
  /**
   * find step classes
   * @param {Number} The index
   */
  stepClass(indx) {
    let active = false;
    let done = false;
    switch (indx) {
    case 1:
    case 2:
    case 3:
      active = this.activeStep == indx;
      break;
    case 4:
      active = this.activeStep == 41 || this.activeStep == 42;
      break;
    }
    done = this.doneSteps[indx];
    return {
      active,
      done
    };
  }

  /**
   * select and fetch product
   * @param  {Object} row The product
   */
  selectProduct(row) {
    this.Product.get({
      id: row.id,
      controller: 'interview'
    }).$promise.then(p => {
      this.selectedProduct = p;
      this.newInterview.product = p.id;
      if(!p.interview) {
        return;
      }
      angular.forEach(p.interview.section, section => {
        angular.forEach(section.question, question => {
          if(question.option && question.option.length > 0) {
            this.selectFields[question.attrs.name] = {};
            angular.forEach(question.option, opt => {
              this.selectFields[question.attrs.name][opt.attrs.result1] = opt.attrs.name;
            });
          }
        });
      });
      this.activeStep = 2;
      this.activeSection = 1;
      this.activeSectionName = p.interview.section[0].attrs.name;
      this.doneSteps[1] = true;
      this.progress = 29.3;
      this.$translate('STEP2_TITLE').then(text => {
        this.activeTitle = text;
      });
      this.util.setInterviewProcess(true);

      this.$timeout(() => document.querySelector('form[name=interviewF] .section-wrap:not(.hide) .form-control').focus(), 1500);
    });
  }
  /**
   * move to next section
   */
  nextSection(interview) {
    if(!this.isSectionDone(interview)) {
      return;
    }
    window.scrollTo(0, 0);
    if(this.activeSection == this.selectedProduct.interview.section.length) {
      return this.stepNext();
    }
    const step = (47 - 23.5) / this.selectedProduct.interview.section.length;
    while(this.activeSection != this.selectedProduct.interview.section.length) {
      const toShowNext = this.evalConditions(this.selectedProduct.interview.section[this.activeSection]);
      this.activeSection++;

      if(toShowNext) {
        this.activeSectionName = this.selectedProduct.interview.section[this.activeSection - 1].attrs.name;
        this.activeSectionCnt++;
        this.progress += step;

        this.$timeout(() => document.querySelector('form[name=interviewF] .section-wrap:not(.hide) .form-control').focus(), 500);
        break;
      }
    }
  }
  /**
   * back to prev section
   */
  prevSection() {
    window.scrollTo(0, 0);
    if(this.activeSection == 1) {
      return this.stepBack();
    }
    const step = (47 - 23.5) / this.selectedProduct.interview.section.length;
    while(this.activeSection != 1) {
      this.activeSection--;
      const toShowNext = this.evalConditions(this.selectedProduct.interview.section[this.activeSection - 1]);
      if(toShowNext) {
        this.activeSectionCnt--;
        this.progress -= step;
        this.activeSectionName = this.selectedProduct.interview.section[this.activeSection - 1].attrs.name;
        break;
      }
    }
  }
  /**
   * step back
   */
  stepBack() {
    switch (this.activeStep) {
    case 2:
      window.scrollTo(0, 0);
      if(this.interviewF.$dirty && this.Auth.isLoggedInSync()) {
        this.newInterview.details = this.interviewForm;
        this.util.confirmBackInInterviewProcess(this.newInterview).then(res => {
          if(!res) {
            return;
          }
          this.interviewF.$setPristine();
          this.stepStart();
        });
      } else {
        this.stepStart();
        this.util.setInterviewProcess(false);
      }
      break;
    case 3:
      window.scrollTo(0, 0);
      this.activeStep = 2;
      this.progress = 23.5;
      this.activeSection = 1;
      this.activeSectionCnt = 1;
      this.activeSectionName = this.selectedProduct.interview.section[0].attrs.name;
      this.doneSteps[2] = false;
      this.$translate('STEP2_TITLE').then(text => {
        this.activeTitle = text;
      });
      break;
    case 41:
      this.activeStep = 3;
      this.progress = 71.4;
      this.doneSteps[3] = false;
      this.generatingDocs = false;
      this.$translate('STEP3_TITLE').then(text => {
        this.activeTitle = text;
      });
      break;
    }
  }
  /**
  * Set back to main product page
  */
  stepStart() {
    this.idInterview = '';
    this.newInterview = {};
    this.interviewForm = {};
    this.selectedProduct = {};
    this.activeStep = 1;
    this.doneSteps[1] = false;
    this.progress = 23.5;
    this.$translate('STEP1_TITLE').then(text => {
      this.activeTitle = text;
    });
  }

  /**
   * step next
   */
  stepNext() {
    switch (this.activeStep) {
    case 2:
      window.scrollTo(0, 0);
      this.activeStep = 3;
      this.progress = 71.4;
      this.doneSteps[2] = true;
      this.$translate('STEP3_TITLE').then(text => {
        this.activeTitle = text;
      });

      this.activeSectionCnt = 0;
      break;
    case 3:
      if(!this.Auth.isLoggedInSync()) {
        this.$uibModal
            .open({
              template: require('../modals/loginRegister.html'),
              controller: ModalCtrl,
              controllerAs: '$ctrl',
              windowClass: 'site-modal',
              backdrop: 'static',
              resolve: {
                modalOpts: () => ({
                  modalSwitchToggle: false
                })
              }
            })
            .result.then(() => {
              this.$timeout(() => {
                if(this.Auth.isLoggedInSync()) {
                  this.generateDocs();
                }
              }, 1000);
            }, _.noop);
      } else {
        this.generateDocs();
      }
      break;
    case 41:
        // bill customer
      const body = {
        user: this.Auth.getCurrentUserSync().id
      };
      this.paymentProcessing = true;
      this.$http
          .post(`/api/products/${this.selectedProduct.id}/orders`, body)
          .then(() => {
            this.paymentProcessing = false;
            this.activeStep = 42;
            this.progress = 100;
            this.doneSteps[4] = true;
            if(this.idInterview) {
              this.deleteInterview(this.idInterview);
            }
            this.$translate('STEP4_2_TITLE').then(text => {
              this.activeTitle = text;
            });
          })
          .catch(e => {
            window.alert(e.data.error);
            this.paymentProcessing = false;
            console.error(e);
          });
      break;
    }
  }

  generateDocs() {
    this.loading = true;
    this.generatingDocs = true;
    //display wait popup if 5 or more files to generate
    if(this.selectedProduct.templates >= 5) {
      this.$http
        .get('/api/messages/random')
        .then(msg => {
          this.waitMsg = msg.data.message;
          this.openWait(this.waitMsg);
        });
    }
    this.Auth.getCurrentUserNow().then(user => {
      this.Auth.refreshCurrentUser(user);
      if(user.role === this.constants.ENTERPRISE_USER) {
        this.interviewForm.REG_COMPANY = user.enterprise.company;
        this.interviewForm.REG_ADDRESS = user.enterprise.address;
        this.interviewForm.REG_POSTCODE = user.enterprise.postcode;
        this.interviewForm.REG_CITY = user.enterprise.city;
        this.interviewForm.PREFS = user.enterprise.preferences;
      } else {
        this.interviewForm.REG_COMPANY = user.company;
        this.interviewForm.REG_ADDRESS = user.address;
        this.interviewForm.REG_POSTCODE = user.postcode;
        this.interviewForm.REG_CITY = user.city;
        this.interviewForm.PREFS = user.preferences;
      }
      const formData = this.interviewForm;
      this.$http
        .post(`/api/products/${this.selectedProduct.id}/interview`, formData)
        .then(resp => {
          this.docs = resp.data;
          this.previewImageList = [];
          _.each(resp.data.documents, doc => {
            this.previewImageList = _.concat(this.previewImageList, doc.previewImage.split('<>'));
          });

          this.activeStep = 41;
          this.progress = 85.7;
          this.doneSteps[3] = true;
          this.loading = false;
          this.$translate('STEP4_TITLE').then(text => {
            this.activeTitle = text;
          });
        })
        .catch(e => {
          console.error(e);
          this.loading = false;
          this.generatingDocs = false;
        });
    });
  }

  localeSensitiveComparator(v1, v2) {
    if(v1.type !== 'string' || v2.type !== 'string') {
      return v1.index < v2.index ? -1 : 1;
    }
    return v1.value.localeCompare(v2.value);
  }

  getCategoryForRow(rowIndex) {
    if(this.cats[2 * rowIndex - 1]) {
      return [this.cats[2 * rowIndex - 2], this.cats[2 * rowIndex - 1]];
    } else {
      return [this.cats[2 * rowIndex - 2]];
    }
  }
  checkForm(keyEvent, form) {
    if(keyEvent.which === 13 && this.isSectionDone(form)) {
      keyEvent.preventDefault();
      this.nextSection(form);
    }
  }
  goTo(...args) {
    let url = args.shift();
    let target = args.shift() || '_self';
    this.$window.open(url, target);
  }
  getSavedInterview(intId) {
    return this.$http.get(`/api/interviews/${intId}`, { user: this.Auth.getCurrentUserSync().id })
    .catch(e => {
      console.error(e);
    });
  }
  deleteInterview(intId) {
    return this.$http.delete(`/api/interviews/${intId}`)
    .catch(e => {
      console.error(e);
    });
  }
  openWait(msg) {
    this.$uibModal.open({
      template: require('../modals/wait.html'),
      controller: ModalCtrl,
      controllerAs: '$ctrl',
      windowClass: 'site-modal',
      size: 'lg',
      resolve: {
        modalOpts: () => ({
          redirect: this.$route,
          messageText: msg
        })
      }
    }).result.then(_.noop, _.noop);
  }
}
export default angular.module('fbdoxApp.producsPage', []).component('productsPage', {
  template: require('./producs-page.html'),
  controller: ProducsPage
})
.name;
