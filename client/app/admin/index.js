'use strict';

import angular from 'angular';
import routes from './admin.routes';

import adminLayout from './components/layout/layout.directive';
import navbar from './components/navbar/navbar.component';
import footer from './components/footer/footer.component';

import UsersComponent from './components/users/users.component';
import ProductsComponent from './components/products/products.component';
import CategoriesComponent from './components/categories/categories.component';
import MessagesComponent from './components/messages/messages.component';

export default angular.module('fbdoxApp.admin', ['fbdoxApp.auth', 'ngRoute',
  adminLayout, navbar, footer, ProductsComponent, UsersComponent, CategoriesComponent, MessagesComponent])
  .config(routes)
  .name;
