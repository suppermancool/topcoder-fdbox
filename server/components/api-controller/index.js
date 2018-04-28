export const respondWithResult = (res, statusCode = 200) => entity =>
  entity ? res.status(statusCode).json(entity) : null;

export const handleEntityNotFound = (res, statusCode = 404) => entity =>
  entity || (res.status(statusCode).json(), null);

export const noContent = res => () => res.status(204).json();

export const handleError = (res, statusCode = 500) => err =>
  res.status(res.statusCode || statusCode).json(err);

export const handleValidationError = (res, statusCode = 422) => err =>
  err.name === 'ValidationError' || err.name === 'CastError'
    ? res.status(statusCode).json(err) : Promise.reject(err);

export const handleForbidden = (res, statusCode = 403) =>
  res.status(statusCode).json();

export const handleMongoError = (res, statusCode = 400) => err =>
  err.name !== 'MongoError' ? Promise.reject(err) : res.status(statusCode).json({
    code: err.code === 11000 ? 'duplicate_value' : err.code,
    message: err.message,
  });


import compose from 'composable-middleware';

export const checkId = () => {
  const isMongoId = id => /^[0-9a-fA-F]{24}$/.test(id);

  return compose()
    .use((req, res, next) => isMongoId(req.params.id) ? next() : res.status(400).json({
      code: 'invalid_id',
      message: 'Invalid ID provided!',
    }));
};

export const removeEntity = res => entity =>
  entity && entity.remove()
    .then(() => res.status(204).end());
