'use strict';

import {Router} from 'express';
import * as controller from './invoices.controller';
import * as auth from '../../auth/auth.service';

let router = new Router();

router.get('/', auth.isAuthenticated(), controller.getInvoices);
router.get('/:id', auth.isAuthenticated(), controller.getInvoice);
router.get('/:id/pdf', auth.isAuthenticated(), controller.getInvoicePDF);

module.exports = router;
