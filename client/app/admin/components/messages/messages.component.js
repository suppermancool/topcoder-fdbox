'use strict';
const angular = require('angular');
const ngRoute = require('angular-route');

export class MessagesComponent {
  message = {};
  messageInit = {};

  messages = [];
  errors = {};

  /*@ngInject*/
  constructor($http, $routeParams, Modal, $location, Message) {
    this.$http = $http;
    this.messageId = $routeParams.messageId;
    this.Modal = Modal;
    this.$location = $location;
    this.Message = Message;
  }

  $onInit() {
    if(this.messageId) {
      return (this.message = this.Message.get({
        id: this.messageId
      }))

      .$promise.then(() => {
        this.messageInit = angular.copy(this.message);
        return this.messageInit;
      });
    }

    this.message = new this.Message();
    this.messages = this.Message.query();
  }

  save(message) {
    message.$save()
      .then(this.toMessages.bind(this))
      .catch(this.handleApiErrors);
  }

  isNew(message = {}) {
    return message.id === undefined;
  }

  onCancelEdits($event, message) {
    if(angular.equals(message, this.messageInit)) {
      return;
    }

    $event.preventDefault();

    this.Modal.confirm.discard('current message').then(() => {
      this.discardChanges();
    })

    .then(this.toMessages.bind(this))
    .catch(angular.noop);
  }

  delete(message) {
    this.Modal.confirm.delete('the current message').then(() =>
      this.$http.delete(`/api/messages/${message.id}`))
    .then(this.toMessages.bind(this))
    .catch(response => {
      this.errors.common = response.data ? response.data.message : '';
    });
  }

  discardChanges() {
    this.message = angular.copy(this.messageInit);
  }

  $clone(obj) {
    return angular.copy(obj);
  }

  toMessages() {
    this.$location.path('/admin/messages');
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

export default angular.module('fbdoxApp.admin/messages', [ngRoute])
  .component('messages', {
    template: require('./messages.html'),
    controller: MessagesComponent,
  })
  .component('message', {
    template: require('./message.html'),
    controller: MessagesComponent,
  })
  .name;
