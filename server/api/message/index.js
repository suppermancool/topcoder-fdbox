'use strict';

import {Router} from 'express';
import * as controller from './message.controller';
import * as auth from '../../auth/auth.service';
import * as ctrl from '../../components/api-controller';

let router = new Router();

router.get('/', auth.hasRole('admin'), controller.index);
router.get('/random', controller.random);
router.get('/:id', ctrl.checkId(), controller.show);
router.post('/', auth.hasRole('admin'), controller.create);
router.put('/:id', auth.hasRole('admin'), ctrl.checkId(), controller.update);
router.delete('/:id', auth.hasRole('admin'), ctrl.checkId(), controller.destroy);

module.exports = router;
