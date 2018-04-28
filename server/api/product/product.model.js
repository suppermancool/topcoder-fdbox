'use strict';

import mongoose, {Schema} from 'mongoose';
import {transformSchema} from '../../components/util';
import Category from '../category/category.model';
import stripe from '../../components/stripe';

const ProductSchema = new Schema({
  identifier: String,
  title: {
    type: String,
    required: true,
  },
  description: String,
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  price: {
    type: Number,
    min: 0,
    get: v => Math.round(v),
    set: v => Math.round(v),
    alias: 'i',
    required: true
  },
  currency: {
    type: String,
    required: true,
    default: 'eur'
  },
  templates: Object,
  interview: Object,
  stripeProductId: String,
  stripeSKUId: String
}, {timestamps: true});

/**
 * Virtuals
 */

const defaultView = function() {
  let {templates = {}, interview = {}} = this;

  let uploadedTemplates = [].concat(
    templates.files || [],
    templates.translations || []
  ).filter(tmpl => !!tmpl.path);

  return {
    id: this.id,
    identifier: this.identifier,
    title: this.title,
    description: this.description,
    category: this.category,
    price: this.price,
    stripeProductId: this.stripeProductId,
    stripeSKUId: this.stripeSKUId,
    templates: uploadedTemplates.length,
    interview: (interview.attrs || {}).name,
  };
};

// The default product details
ProductSchema
  .virtual('details')
  .get(defaultView);

// The product details including the interview data
ProductSchema
  .virtual('interviewData')
  .get(function() {
    return Object.assign({}, defaultView.call(this), {
      interview: this.interview,
    });
  });

// Price is number and > 0
ProductSchema
  .path('price')
  .validate(price => !isNaN(price) && price >= 0, 'Price shouldn\'t be less than 0.');

ProductSchema
  .path('category')
  .validate(value => Category.findById(value).exec()
    .then(category => !!category)
  , 'Specified category does not exist.');

/**
 * Pre-save hooks
 */
ProductSchema
  .pre('save', function(next) {
    if(!this.isNew) {
      return next();
    }
    stripe.products.list({ url: `http://fbdox.at/api/products/${this.id}`})
    .then(products => {
      if(products.data.length) {
        // already exists in Stripe
        this.stripeProductId = products.data[0].id;
        this.stripeSKUId = products.data[0].skus.data[0].id;
        console.log(`Product ${this.title} is stripe product`);
        return next();
      }
      return stripe.products.create({
        name: this.title,
        description: this.description,
        url: `http://fbdox.at/api/products/${this.id}`,
        shippable: false,
        metadata: {
          productId: this.id,
          categoryId: this.category.toString()
        }
      })
      .then(product => {
        this.stripeProductId = product.id;
        console.log(`Product ${this.title} created in stripe. Creating SKU...`);
        return stripe.skus.create({
          product: product.id,
          currency: 'eur',
          inventory: {
            type: 'infinite'
          },
          //price: this.price
          price: 1000
        })
        .then(sku => {
          this.stripeSKUId = sku.id;
        });
      });
    })
    .then(next.bind(this, null))
    .catch(next);
  });

/**
 * Pre-remove hooks
 */
ProductSchema
  .pre('remove', function(next) {
    if(this.stripeProductId) {
      console.log(`Product ${this.id} delete request. Deleting in stripe...`);
      if(this.stripeSKUId) {
        // Need to delete SKU first
        console.log(`Product ${this.id} has SKU deleting it first...`);
        return stripe.skus.del(this.stripeSKUId)
        .then(() => stripe.products.del(this.stripeProductId))
        .then(next.bind(this, null))
        .catch(next);
      }
      return stripe.products.del(this.stripeProductId)
        .then(next.bind(this, null))
        .catch(next);
    }
    return next();
  });

const Product = mongoose.model('Product', transformSchema(ProductSchema));
export default Product;
