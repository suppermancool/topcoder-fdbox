'use strict';

import {Router} from 'express';
import * as controller from './order.invoices.controller';
import * as auth from '../../auth/auth.service';

let router = new Router();

router.get('/', auth.isAuthenticated(), controller.getOrderInvoices);
router.get('/:id', auth.isAuthenticated(), controller.getOrderInvoice);
router.get('/:id/pdf', auth.isAuthenticated(), controller.getOrderInvoicePDF);


module.exports = router;
