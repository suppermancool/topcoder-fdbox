import crypto from 'crypto';

export const uuid = () =>
  crypto.randomBytes(8).toString('hex');

export const transformSchema = schema => {
  if(!schema.options.toJSON) {
    schema.options.toJSON = {};
  }

  schema.options.toJSON.transform = (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  };

  return schema;
};
