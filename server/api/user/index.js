'use strict';

import {Router} from 'express';
import * as controller from './user.controller';
import * as auth from '../../auth/auth.service';
import * as ctrl from '../../components/api-controller';

const constants = require('../../config/constants');
let router = new Router();

router.get('/usage', auth.hasRole(constants.ADMIN), controller.generateUsage);
router.get('/:id/usage', auth.hasRole(constants.ADMIN), ctrl.checkId(), controller.generateUsage);

router.get('/', auth.hasRole(constants.ENTERPRISE), controller.index);
router.post('/', auth.parseAuthHeaders(), controller.create);

router.get('/me', auth.isAuthenticated(), controller.me);
router.put('/me', auth.isAuthenticated(), controller.updateMe);
router.put('/me/password', auth.isAuthenticated(), controller.changePassword);
router.put('/me/password/reset', controller.resetPassword);

router.get('/:id', auth.hasRole(constants.ENTERPRISE), ctrl.checkId(), controller.show);
router.get('/:id/members', auth.hasRole(constants.ENTERPRISE), ctrl.checkId(), controller.getMembers);
router.get('/:id/invoices', auth.isAuthenticated(), ctrl.checkId(), controller.getInvoices);
router.put('/:id', auth.hasRole(constants.ENTERPRISE), ctrl.checkId(), controller.updateUser);
router.put('/:id/password', auth.isAuthenticated(), controller.changePassword);
router.delete('/:id', auth.hasRole(constants.ENTERPRISE), ctrl.checkId(), controller.destroy);

module.exports = router;
