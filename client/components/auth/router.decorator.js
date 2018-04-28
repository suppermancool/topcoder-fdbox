'use strict';

import _ from 'lodash';
import ModalCtrl from '../../app/site/components/modals/modalCtrl';

export function routerDecorator($rootScope, $location, Auth, $uibModal) {
  'ngInject';

  Auth.getCurrentUser(() => {
    // Redirect to login if route requires auth and the user is not logged in, or doesn't have required role
    $rootScope.$on('$routeChangeStart', (event, next) => {
      if(!next.authenticate || typeof next.authenticate === 'string' && Auth.hasRoleSync(next.authenticate) || Auth.isLoggedInSync()) {
        return;
      }
      event.preventDefault();
      $uibModal.open({
        template: require('../../app/site/components/modals/loginRegister.html'),
        controller: ModalCtrl,
        controllerAs: '$ctrl',
        windowClass: 'site-modal',
        backdrop: 'static',
        resolve: {
          modalOpts: () => ({
            redirect: next,
            modalSwitchToggle: false
          })
        }
      }).result.then(_.noop, _.noop);
    });
  });
}
