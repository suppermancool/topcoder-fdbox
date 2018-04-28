'use strict';
/*eslint no-invalid-this:0*/
import crypto from 'crypto';
mongoose.Promise = require('bluebird');
import mongoose, {Schema} from 'mongoose';
import {userRoles, subscriptionPlans, subscriptionTaxPercentage} from '../../config/environment';
import {transformSchema} from '../../components/util';
import _ from 'lodash';
import stripe, {stripeCustomerExists} from '../../components/stripe';
const constants = require('../../config/constants');

const UserSchema = new Schema({
  account: {
    stripeSource: String,
    stripeCustomerId: String,
    stripeSubscriptionIDs: Array,
    billingDiscount: String,
    frozen: {
      type: Boolean,
      default: false
    }
  },
  email: {
    type: String,
    lowercase: true,
    required: true,
    unique: true
  },
  role: {
    type: String,
    default: constants.ENTERPRISE
  },
  password: {
    type: String,
    required: true
  },
  provider: String,
  salt: String,
  company: String,
  fname: String,
  lname: String,
  address: String,
  postcode: String,
  city: String,
  vatNumber: String,
  enterprise: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  preferences: {
    standardFontName: String,
    standardFontSize: String,
  }
}, {timestamps: true});

/**
 * Virtuals
 */
// Public profile information
UserSchema
  .virtual('fullName')
  .get(function() {
    return `${this.fname}${this.lname ? ` ${this.lname}` : ''}`;
  });

// Public profile information
UserSchema
  .virtual('basicProfile')
  .get(function() {
    return {
      email: this.email,
      fullName: this.fullName,
      role: this.role
    };
  });

// Public profile information
UserSchema
  .virtual('profile')
  .get(function() {
    return {
      id: this.id,
      email: this.email,
      fullName: this.fullName,
      fname: this.fname,
      lname: this.lname,
      role: this.role,
      company: this.company,
      billingDiscount: this.account.billingDiscount,
      createdAt: this.createdAt
    };
  });

// Public profile information
UserSchema
  .virtual('detailedProfile')
  .get(function() {
    return {
      id: this.id,
      email: this.email,
      fullName: this.fullName,
      fname: this.fname,
      lname: this.lname,
      role: this.role,
      company: this.company,
      address: this.address,
      postcode: this.postcode,
      city: this.city,
      vatNumber: this.vatNumber,
      preferences: this.preferences,
      enterprise: this.enterprise,
      account: this.account,
      createdAt: this.createdAt
    };
  });

// Non-sensitive info we'll be putting in the token
UserSchema
  .virtual('token')
  .get(function() {
    return {
      _id: this._id,
      role: this.role
    };
  });

/**
 * Validations
 */

// Validate empty email
UserSchema
  .path('email')
  .validate(email => email.length, 'Email cannot be blank');

// Check is valid email
UserSchema
  .path('email')
  .validate(email =>
    /^([\w-.]+@([\w-]+\.)+[\w-]{2,4})?$/.test(email), 'Doesn\'t look like a valid email');

// Validate empty password
UserSchema
  .path('password')
  .validate(password => !!password.length, 'Password cannot be blank');

// Validate email is not taken
UserSchema
  .path('email')
  .validate(function(value) {
    return !this || User.findOne({ email: value }).exec()
      .then(user => !user || this.id === user.id);
  }, 'Diese E-Mail-Adresse existiert bereits.');

const validatePresenceOf = function(value) {
  return value && value.length;
};

/**
 * Pre-remove hook
 */
UserSchema
  .pre('remove', function(next) {
    if(this.account && this.account.stripeCustomerId) {
      console.log(`User ${this.id} delete request. Deleting in stripe...`);
      // Delete the customer in Stripe too
      return stripe.customers.del(this.account.stripeCustomerId)
      .then(next.bind(this, null))
      .catch(next);
    }
    return next();
  });

/**
 * Pre-save hooks
 */
UserSchema
  .pre('save', function(next) {
    // Handle new/update passwords
    if(!this.isModified('password')) {
      return next();
    }

    if(!validatePresenceOf(this.password)) {
      return next(new Error('Invalid password'));
    }

    // Make salt with a callback
    this.makeSalt((saltErr, salt) => {
      if(saltErr) {
        return next(saltErr);
      }
      this.salt = salt;
      this.encryptPassword(this.password, (encryptErr, hashedPassword) => {
        if(encryptErr) {
          return next(encryptErr);
        }
        this.password = hashedPassword;
        return next();
      });
    });
  });
UserSchema
  .pre('save', function(next) {
    // Handle only UPDATES
    if(this.isNew) {
      return next();
    }
    const allP = [];
    if(this.isModified('account.stripeSource')) {
      console.log(`User ${this.id} stripeSource update. Updating in stripe...`);
      allP.push(
        stripe.customers.update(this.account.stripeCustomerId, {
          source: this.account.stripeSource
        })
      );
    }
    if(this.isModified('account.billingDiscount') && this.account.stripeSubscriptionIDs[0]) {
      console.log(`User ${this.id} billingDiscount update. Updating in stripe...`);
      allP.push(
        stripe.subscriptions.update(this.account.stripeSubscriptionIDs[0], {
          coupon: this.account.billingDiscount ? this.account.billingDiscount : null
        })
      );
    }
    return Promise.all(allP)
      .then(next.bind(this, null))
      .catch(next);
  });
UserSchema
  .pre('save', function(next) {
    // Handle only NEW RECORDS
    if(!this.isNew) {
      return next();
    }
    // Make sure stripeTokens are present for
    // users with role 'enterprise'
    if(this.role === constants.ENTERPRISE) {
      if(!this.account.stripeSource) {
        return next(new Error('Stripe source token is required to create and bill user'));
      }
    }
    // New enterprises and enterprise-users
    // need to be created as customers in stripe
    if(this.role !== constants.ADMIN) {
      return stripeCustomerExists(this.email)
      .then(existingCustomer => {
        if(existingCustomer) {
          this.account.stripeCustomerId = existingCustomer.id;
          if(existingCustomer.subscriptions.data.length) {
            this.account.stripeSubscriptionIDs = _.map(existingCustomer.subscriptions.data, 'id');
          }
          return next();
        } else {
          console.log(`New user ${this.id}. Creating in stripe...`);
          // Create new stripe customer
          const newCustomer = {
            email: this.email,
            description: `${this.fname}  ${this.lname}`,
            metadata: {
              userId: this.id,
              role: this.role
            }
          };
          if(this.account.stripeSource) {
            newCustomer.source = this.account.stripeSource;
          }
          return stripe.customers.create(newCustomer)
            .then(customer => {
              this.account.stripeCustomerId = customer.id;
              // Customer created
              // Assign the default subscription plan
              // to 'enterprise' role
              // and bill them
              if(this.role === constants.ENTERPRISE) {
                const newSub = {
                  customer: customer.id,
                  plan: subscriptionPlans[0].id,
                  tax_percent: subscriptionTaxPercentage
                };
                if(this.account.billingDiscount) {
                  newSub.coupon = this.account.billingDiscount;
                }
                console.log(`New user ${this.id} created in stripe. Try to create subscription and bill now...`);
                return stripe.subscriptions.create(newSub).then(subscription => {
                  this.account.stripeSubscriptionIDs = [subscription.id];
                  next();
                });
              }
              next();
            });
        }
      })
      .catch(next);
    }
    // If here just continue.
    // Nothing to do here...
    return next();
  });

/**
 * Methods
 */
UserSchema.methods = {
  /**
   * Authenticate - check if the passwords are the same
   *
   * @param {String} password
   * @param {Function} callback
   * @return {Boolean}
   * @api public
   */
  authenticate(password, callback) {
    if(!callback) {
      return this.password === this.encryptPassword(password);
    }

    this.encryptPassword(password, (err, pwdGen) => {
      if(err) {
        return callback(err);
      }

      if(this.password === pwdGen) {
        return callback(null, true);
      } else {
        return callback(null, false);
      }
    });
  },

  /**
   * Make salt
   *
   * @param {Number} [byteSize] - Optional salt byte size, default to 16
   * @param {Function} callback
   * @return {String}
   * @api public
   */
  makeSalt(...args) {
    let byteSize;
    let callback;
    let defaultByteSize = 16;

    if(typeof args[0] === 'function') {
      callback = args[0];
      byteSize = defaultByteSize;
    } else if(typeof args[1] === 'function') {
      callback = args[1];
    } else {
      throw new Error('Missing Callback');
    }

    if(!byteSize) {
      byteSize = defaultByteSize;
    }

    return crypto.randomBytes(byteSize, (err, salt) => {
      if(err) {
        return callback(err);
      } else {
        return callback(null, salt.toString('base64'));
      }
    });
  },

  /**
   * Encrypt password
   *
   * @param {String} password
   * @param {Function} callback
   * @return {String}
   * @api public
   */
  encryptPassword(password, callback) {
    if(!password || !this.salt) {
      if(!callback) {
        return null;
      } else {
        return callback('Missing password or salt');
      }
    }

    const defaultIterations = 10000;
    const defaultKeyLength = 64;
    const salt = new Buffer(this.salt, 'base64');

    if(!callback) {
      return crypto.pbkdf2Sync(password, salt, defaultIterations, defaultKeyLength, 'sha1')
        .toString('base64');
    }

    return crypto.pbkdf2(password, salt, defaultIterations, defaultKeyLength, 'sha1', (err, key) => {
      if(err) {
        return callback(err);
      } else {
        return callback(null, key.toString('base64'));
      }
    });
  },

  hasRole(roleRequired) {
    return userRoles.indexOf(this.role) >= userRoles.indexOf(roleRequired);
  },

  isAdmin() {
    return this.role === constants.ADMIN;
  },

  isEnterprise() {
    return this.role === constants.ENTERPRISE;
  },

  isEnterpriseUser() {
    return this.role === constants.ENTERPRISE_USER;
  },
};

const User = mongoose.model('User', transformSchema(UserSchema));
export default User;
