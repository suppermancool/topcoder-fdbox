'use strict';
const angular = require('angular');
const ngRoute = require('angular-route');

export class CategoriesComponent {
  category = {};
  categoryInit = {};

  categories = [];
  errors = {};

  /*@ngInject*/
  constructor($http, $routeParams, Modal, $location, Category) {
    this.$http = $http;
    this.categoryId = $routeParams.categoryId;
    this.Modal = Modal;
    this.$location = $location;
    this.Category = Category;
  }

  $onInit() {
    if(this.categoryId) {
      return (this.category = this.Category.get({
        id: this.categoryId
      }))

      .$promise.then(() => {
        this.categoryInit = angular.copy(this.category);
        return this.categoryInit;
      });
    }

    this.category = new this.Category();
    this.categories = this.Category.query();
  }

  save(category) {
    category.$save()
      .then(this.toCategories.bind(this))
      .catch(this.handleApiErrors);
  }

  isNew(category = {}) {
    return category.id === undefined;
  }

  onCancelEdits($event, category) {
    if(angular.equals(category, this.categoryInit)) {
      return;
    }

    $event.preventDefault();

    this.Modal.confirm.discard(category.title).then(() => {
      this.discardChanges();
    })

    .then(this.toCategories.bind(this))
    .catch(angular.noop);
  }

  delete(category) {
    this.Modal.confirm.delete(`the product category ${category.title}`).then(() =>
      this.$http.delete(`/api/categories/${category.id}`))

    .then(this.toCategories.bind(this))
    .catch(response => {
      let err = response.data;
      if(response.status === 400 && err.code === 'dependent_products') {
        this.errors.onDelete = err;
      }
    });
  }

  discardChanges() {
    this.category = angular.copy(this.categoryInit);
  }

  $clone(obj) {
    return angular.copy(obj);
  }

  toCategories() {
    this.$location.path('/admin/categories');
  }

  handleApiErrors = err => {
    let {data} = err;

    if(err.status === 422 && data.name === 'ValidationError') {
      this.errors.title = data.errors.title.message;
      this.cform.title.$setValidity('api', false);
    }
  }

  clearErrors(field) {
    delete this.errors[field];
    this.cform[field].$setValidity('api', true);
  }
}

export default angular.module('fbdoxApp.admin/categories', [ngRoute])
  .component('categories', {
    template: require('./categories.html'),
    controller: CategoriesComponent,
  })
  .component('category', {
    template: require('./category.html'),
    controller: CategoriesComponent,
  })
  .name;
