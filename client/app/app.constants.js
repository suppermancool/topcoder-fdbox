'use strict';

import angular from 'angular';

export default angular.module('fbdoxApp.constants', [])
  .constant('appConfig', require('../../server/config/environment/shared'))
  .constant('constants', { ENTERPRISE: 'enterprise',
                           ENTERPRISE_USER: 'enterprise-user',
                           ADMIN: 'admin' })
  .name;
