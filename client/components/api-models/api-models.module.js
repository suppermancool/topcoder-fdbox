'use strict';

import angular from 'angular';
import ProductsModel from './products.model';
import { CategoriesResource } from './categories.model';
import { MessagesResource } from './messages.model';

export default angular.module('fbdoxApp.api-models', [ProductsModel])
  .factory('Category', CategoriesResource)
  .factory('Message', MessagesResource)
  .name;
