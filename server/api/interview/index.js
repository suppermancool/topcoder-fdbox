'use strict';

import {Router} from 'express';
import * as controller from './interview.controller';
import * as auth from '../../auth/auth.service';
import * as ctrl from '../../components/api-controller';

let router = new Router();

router.post('/', auth.isAuthenticated(), controller.create);
router.get('/', auth.isAuthenticated(), controller.getInterviews);
router.delete('/', auth.isAuthenticated(), controller.deleteInterviews);

router.get('/:id', auth.isAuthenticated(), ctrl.checkId(), controller.show);
router.put('/:id', auth.isAuthenticated(), ctrl.checkId(), controller.updateInterview);
router.delete('/:id', auth.isAuthenticated(), ctrl.checkId(), controller.destroy);

module.exports = router;
