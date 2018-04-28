'use strict';

import mongoose, {Schema} from 'mongoose';

const FinalProductSchema = new Schema({
  files: Array,
  dirHash: String,

  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
  },

  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },

  account: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
}, {timestamps: true});

export default mongoose.model('FinalProduct', FinalProductSchema);
