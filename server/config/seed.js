/**
 * Populate DB with sample data on server start
 * to disable, edit config/environment/index.js, and set `seedDB: false`
 */

'use strict';
import User from '../api/user/user.model';
import Product from '../api/product/product.model';
import Category from '../api/category/category.model';
import FinalProduct from '../api/final-product/final-product.model';
import config from './environment/';

export default function seedDatabaseIfNeeded() {
  if(config.seedDB) {
    User.find({}).remove()
      .then(() =>
        User.create(...require('./seeds/users.json'))
        .then(() => {
          // finished populating users
        })
        .catch(err => {
          // error populating users
          console.error('error populating users', err);
        })
      );

    let waitCategories = Category.find({}).remove()
      .then(() =>
        Category.create(...require('./seeds/categories.json'))
        .then(() => {
          // finished populating categories
        })
        .catch(err => {
          // error populating categories
          console.error('error populating categories', err);
        })
      );

    waitCategories.then(() => Product.find({}).remove())
      .then(() =>
        Product.create(...require('./seeds/products.json'))
        .then(() => {
          // finished populating products
        })
        .catch(err => {
          // error populating products
          console.error('error populating products', err);
        })
      );

    FinalProduct.find({}).remove()
      .then(() =>
        FinalProduct.create(...require('./seeds/finalprods.json'))
        .then(() => {
          // finished populating final products
        })
        .catch(err => {
          // error populating final products
          console.error('error populating final products', err);
        })
      );
  }
}
