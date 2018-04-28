'use strict';

import {Router} from 'express';
import * as controller from './final-product.controller';
import * as auth from '../../auth/auth.service';
import * as ctrl from '../../components/api-controller';

const router = new Router();

router.get('/:id', auth.isAuthenticated(), ctrl.checkId(), controller.sendMail);

module.exports = router;
