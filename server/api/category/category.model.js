'use strict';

import mongoose, {Schema} from 'mongoose';
import {transformSchema} from '../../components/util';

const CategorySchema = new Schema({
  title: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
    required: true
  }
}, {timestamps: true});

// Validate title
CategorySchema
  .path('title')
  .validate(title => !!title.trim(), 'Category title can\'t be empty.');

// Validate category is not taken
CategorySchema
  .path('title')
  .validate(function(title) {
    return !this || Category.findOne({title}).exec()
      .then(category => !category || this.id === category.id);
  }, 'The specified category already exists.');

// Validate description
CategorySchema
  .path('description')
  .validate(description => !!description.trim(), 'Category description can\'t be empty.');

const Category = mongoose.model('Category', transformSchema(CategorySchema));
export default Category;
