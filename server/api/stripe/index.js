'use strict';

import {Router} from 'express';
import * as controller from './stripe.controller';

let router = new Router();

router.post('/', controller.handleEvent);

module.exports = router;
