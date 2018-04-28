'use strict';

import angular from 'angular';
import routes from './site.routes';

import siteLayout from './components/layout/layout.directive';
import navbar from './components/navbar/navbar.component';
import footer from './components/footer/footer.component';
import InputTextComponent from './components/input-text/input-text.component';
import InputSelectComponent from './components/input-select/input-select.component';
import InputDatepickerComponent from './components/input-datepicker/input-datepicker.component';
import ClickOutSide from './components/clickOutside/click-outside';
import InputNumberComponent from './components/input-number/input-number.component';
import LandingPage from './components/landing-page/landing-page.component';
import ProducsPage from './components/producs-page/producs-page.component';
import ProfilePage from './components/profile-page/profile-page.component';

export default angular.module('fbdoxApp.site', ['fbdoxApp.auth', 'ngRoute',
  InputTextComponent, InputSelectComponent, InputDatepickerComponent, ClickOutSide, InputNumberComponent,
  siteLayout, LandingPage, ProducsPage, ProfilePage, navbar, footer])
  .config(routes)
  .name;
