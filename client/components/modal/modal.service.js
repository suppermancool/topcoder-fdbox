'use strict';

import angular from 'angular';

export function Modal($rootScope, $uibModal, $translate) {
  'ngInject';

  let cancel;
  let del;
  let sure;
  let conf;
  let want;
  /* Currently there is no need to translate Warning. Only English used in Admin Page */
  const warn = 'Warning';

  $translate('CANCEL2').then(text => {
    cancel = text;
  });
  $translate('DELETE').then(text => {
    del = text;
  });
  $translate('SURE').then(text => {
    sure = text;
  });
  $translate('WANT').then(text => {
    want = text;
  });
  $translate('CONFIRM_MODAL').then(text => {
    conf = text;
  });

  /**
   * Opens a modal
   * @param  {Object} scope      - an object to be merged with modal's scope
   * @param  {String} modalClass - (optional) class(es) to be applied to the modal
   * @return {Object}            - the instance $uibModal.open() returns
   */
  function openModal(scope = {}, modalClass = 'modal-default') {
    let modalScope = $rootScope.$new();

    angular.extend(modalScope, scope);

    return $uibModal.open({
      template: require('./modal.html'),
      windowClass: modalClass,
      scope: modalScope
    });
  }

  const modalConfig = (params = {}) => {
    let htmlString;
    if($translate.proposedLanguage() === 'en') {
      htmlString = `<p>${sure} ${params.action} ${params.target}?</p>`;
    } else {
      htmlString = `<p>${sure} ${params.target} ${params.action} ${want}?</p>`;
    }
    return {
      modal: {
        dismissable: params.dismissable || true,
        title: `${conf} ${params.action}`,
        html: htmlString,
        buttons: [{
          classes: 'btn-default btn-secondary',
          text: cancel,
          click(e) {
            params.modal.modal.dismiss(e);
          }
        }, {
          classes: `btn-${params.type} text-capitalize`,
          text: params.action,
          click(e) {
            params.modal.modal.close(e);
          }
        }]
      }
    };
  };

  const warnConfig = (params = {}) => ({
    modal: {
      dismissable: params.dismissable || true,
      title: params.title,
      html: params.html,
      buttons: [{
        classes: 'btn-default',
        text: 'OK',
        click(e) {
          params.modal.modal.dismiss(e);
        }
      }]
    }
  });

  // Public API here
  return {

    /* Confirmation modals */
    confirm: {

      /**
       * Create a function to open a delete confirmation modal (ex. ng-click='myModalFn(name, arg1, arg2...)')
       * @param  {Function} del - callback, ran when delete is confirmed
       * @return {Promise}
       */
      delete(...args) {
        let name = args.shift();
        let deleteModal = {};

        deleteModal.modal = openModal(modalConfig({
          modal: deleteModal,
          action: del,
          type: 'default',
          target: `${name}`,
        }), 'site-modal modal-danger');

        return deleteModal.modal.result;
      },

      /**
       * Create a function to open a discard confirmation modal (ex. ng-click='myModalFn(name, arg1, arg2...)')
       * @return {Promise}
       */
      discard(...args) {
        let name = args.shift();
        let discardModal = {};

        discardModal.modal = openModal(modalConfig({
          modal: discardModal,
          action: 'discard',
          type: 'warning',
          target: `changes made to ${name}`,
        }), 'site-modal modal-warning');

        return discardModal.modal.result;
      },
      /**
       * Create a function to open a warning confirmation modal (ex. ng-click='myModalFn(name, arg1, arg2...)')
       * @return {Promise}
      */
      warn(...args) {
        let warnMessage = args.shift();
        let warnModal = {};

        warnModal.modal = openModal(warnConfig({
          modal: warnModal,
          title: `${warn}`,
          type: 'warning',
          html: `<p>${warnMessage}</p>`,
        }), 'site-modal modal-warning');

        return warnModal.modal.result;
      },
    }
  };
}

export default angular.module('fbdoxApp.Modal', [])
  .factory('Modal', Modal)
  .name;
