export function notFound(req, _res, next) {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

export function errorHandler(error, _req, res, _next) {
  const status = error.statusCode || (error.code === 11000 ? 409 : 500);
  const message = error.code === 11000 ? 'An account with this email already exists' : error.message;
  res.status(status).json({ success: false, data: null, message });
}
