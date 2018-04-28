'use strict';

import mongoose, {Schema} from 'mongoose';
import {transformSchema} from '../../components/util';

const MessageSchema = new Schema({
  text: {
    type: String,
    required: true
  }
}, {timestamps: true});

// Validate description
MessageSchema
  .path('text')
  .validate(text => !!text.trim(), 'Message can\'t be empty.');

const Message = mongoose.model('Message', transformSchema(MessageSchema));
export default Message;
