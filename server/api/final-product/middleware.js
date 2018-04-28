import compose from 'composable-middleware';
import FinalProduct from './final-product.model';

const respond = (res, status = 404) => res.status(status).end();

export const isOwner = () =>
  compose()
    .use((req, res, next) => {
      // if not authenticated, return 401
      if(!req.user) {
        return respond(res, 401);
      }

      // if admin allow
      if(req.user.isAdmin()) {
        return next();
      }

      FinalProduct.findOne({account: req.user.enterprise || req.user, dirHash: req.params.dirHash})
        .exec()
        .then(prod => prod ? next() : respond(res));
    });
