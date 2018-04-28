'use strict';

import {Router} from 'express';
import * as controller from './category.controller';
import * as auth from '../../auth/auth.service';
import * as ctrl from '../../components/api-controller';

let router = new Router();

router.get('/', controller.index);
router.get('/:id', ctrl.checkId(), controller.show);
router.post('/', auth.hasRole('admin'), controller.create);
router.put('/:id', auth.hasRole('admin'), ctrl.checkId(), controller.update);
router.delete('/:id', auth.hasRole('admin'), ctrl.checkId(), controller.destroy);

module.exports = router;
