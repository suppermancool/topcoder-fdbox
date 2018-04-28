'use strict';

import angular from 'angular';
import ngAnimate from 'angular-animate';
import ngCookies from 'angular-cookies';
import ngResource from 'angular-resource';
import ngSanitize from 'angular-sanitize';
import ngTranslate from 'angular-translate';
import uiBootstrap from 'angular-ui-bootstrap';
import ngRoute from 'angular-route';
import tmhDyanmicLocale from 'angular-dynamic-locale';
import { routeConfig } from './app.config';
import _Auth from '../components/auth/auth.module';
import _ApiModels from '../components/api-models/api-models.module';
import account from './account';
import admin from './admin';
import constants from './app.constants';
import util from '../components/util/util.module';
import filters from '../components/filters';
import modal from '../components/modal/modal.service';
import ngFile from '../components/ng-file/ng-file.directive';
import spinner from '../components/spinner/spinner-directive';
import mongooseError from '../components/mongoose-error/mongoose-error.directive';
import site from './site';
import stripeCheckout from '../components/stripe/checkout';
import stripe from '../components/stripe';
import stripeElements from '../app/site/components/stripe-elements/stripe-elements.directive';

import './app.scss';

angular.module('fbdoxApp', [ngCookies, ngResource, ngSanitize, ngRoute, uiBootstrap, _Auth, account,
  _ApiModels, ngTranslate, admin, constants, util, filters, ngFile, modal, mongooseError, site, stripeCheckout, stripe,
  ngAnimate, spinner, stripeElements, tmhDyanmicLocale
])
  .config(routeConfig)
  .run(($rootScope, $location, Auth, $translate) => {
    'ngInject';

    // Redirect to login if route requires auth and you're not logged in
    $rootScope.$on('$stateChangeStart', (event, next) => {
      Auth.isLoggedIn(loggedIn => {
        if(next.authenticate && !loggedIn) {
          $location.path('/login');
        }
      });
    });
    // Redirect to homepage if logged in user trying to access a route without privilege
    $rootScope.$on('$routeChangeError', (evt, cur, prev, reject) => {
      if(typeof cur.authenticate != 'undefined' && cur.authenticate == 'admin' && reject == 'not_admin') {
        $location.path('/');
      }
    });
    if($location.path().indexOf('/admin') === 0) {
      $translate.use('en');
    }
  })
  .run($templateCache => {
    'ngInject';

    $templateCache.put('producs-page/tabs/s1.html', require('./site/components/producs-page/tabs/s1.html'));
    $templateCache.put('producs-page/tabs/s2.html', require('./site/components/producs-page/tabs/s2.html'));
    $templateCache.put('producs-page/tabs/s3.html', require('./site/components/producs-page/tabs/s3.html'));
    $templateCache.put('producs-page/tabs/s4-1.html', require('./site/components/producs-page/tabs/s4-1.html'));
    $templateCache.put('producs-page/tabs/s4-2.html', require('./site/components/producs-page/tabs/s4-2.html'));
    $templateCache.put('producs-page/popovers/cats-popover.html', require('./site/components/producs-page/popovers/cats-popover.html'));
    $templateCache.put('producs-page/popovers/date-popover.html', require('./site/components/producs-page/popovers/date-popover.html'));

    $templateCache.put('profile-page/tabs/acc-info-tab.html', require('./site/components/profile-page/tabs/acc-info-tab.html'));
    $templateCache.put('profile-page/tabs/change-pass-tab.html', require('./site/components/profile-page/tabs/change-pass-tab.html'));
    $templateCache.put('profile-page/tabs/manage-payment-tab.html', require('./site/components/profile-page/tabs/manage-payment-tab.html'));
    $templateCache.put('profile-page/tabs/download-tab.html', require('./site/components/profile-page/tabs/download-tab.html'));
    $templateCache.put('profile-page/tabs/manage-acc-tab.html', require('./site/components/profile-page/tabs/manage-acc-tab.html'));
    $templateCache.put('profile-page/tabs/saved-interviews.html', require('./site/components/profile-page/tabs/saved-interviews.html'));
  });

angular.element(document)
  .ready(() => {
    angular.bootstrap(document, ['fbdoxApp'], {
      strictDi: true
    });
  });
