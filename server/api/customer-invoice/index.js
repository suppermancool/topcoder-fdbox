'use strict';

import {Router} from 'express';
import * as controller from './customer.invoices.controller';
import * as auth from '../../auth/auth.service';

let router = new Router();

router.get('/:dateStart/:dateEnd/zip', auth.hasRole('admin'), controller.getInvoicesZip);

module.exports = router;
