'use strict';

import mongoose, {Schema} from 'mongoose';
import Product from '../product/product.model';
import _ from 'lodash';

const InterviewSchema = new Schema({
  details: Object,

  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },

  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {timestamps: true});
//Auto delete interview data 31 days after last update. 31 days = 2,678,400 seconds
InterviewSchema.index({updatedAt: 1}, {expireAfterSeconds: 2678400});

// Details not empty
InterviewSchema
  .path('details')
  .validate(details => !!_.isObject(details), 'Interview can\'t be empty.');
//Product exists
InterviewSchema
  .path('product')
  .validate(value => Product.findById(value).exec()
    .then(product => !!product)
  , 'Specified product does not exist.');

export default mongoose.model('Interview', InterviewSchema);
