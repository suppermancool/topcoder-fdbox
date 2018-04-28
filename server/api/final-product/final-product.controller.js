/**
 * POST     /api/finalprods/:id              ->  sendMail
 */

'use strict';

import _ from 'lodash';
import FinalProduct from './final-product.model';
import * as Mailer from '../../components/mailer';
import * as ctrl from '../../components/api-controller';
import config from '../../config/environment';

// Send generated final product via email
export const sendMail = (req, res) => {
  let query = FinalProduct.findById(req.params.id);

  if(!req.user.isAdmin()) {
    query = FinalProduct.findOne({_id: req.params.id, user: req.user});
  }

  return query.populate('product').exec()
    .then(ctrl.handleEntityNotFound(res))
    .then(fprod => fprod && Mailer.send({
      to: req.user.email,
      subject: `Export files for ${fprod.product.title}`,
      text: 'Documents attached to mail.',
      attachments: _.flattenDeep(fprod.files.map(file => file.documents.map(doc => ({
        path: `${config.uploads.dir}/${config.uploads.docs}/${fprod.dirHash}/${doc.title}`
      }))))
    })
      .catch(err => {
        console.error(`Error while sending email: ${err.message}`);
        return Promise.reject({status: 500, message: 'Error while sending your email.'});
      }))
    .then(result => result && res.status(204).send())
    .catch(ctrl.handleError(res));
};
