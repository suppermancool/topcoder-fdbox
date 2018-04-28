'use strict';

import {Router} from 'express';
import * as controller from './product.controller';
import * as auth from '../../auth/auth.service';
import { handleProductUpload } from './product.middleware';
import uploadMiddleware from '../../components/upload/middleware';

import * as ctrl from '../../components/api-controller';

let router = new Router();

router.get('/', controller.index);
router.post('/', auth.hasRole('admin'), uploadMiddleware(), handleProductUpload(), controller.create);
router.get('/:id', ctrl.checkId(), controller.show.bind(0, void 0));
router.put('/:id', auth.hasRole('admin'), ctrl.checkId(), uploadMiddleware(), handleProductUpload(), controller.update);
router.delete('/:id', auth.hasRole('admin'), ctrl.checkId(), controller.destroy);

router.get('/:id/interview', ctrl.checkId(), controller.show.bind(0, 'interviewData'));
router.post('/:id/interview', auth.isAuthenticated(), ctrl.checkId(), controller.saveInterview);

router.post('/:id/orders', auth.isAuthenticated(), ctrl.checkId(), controller.orderProduct);

module.exports = router;
