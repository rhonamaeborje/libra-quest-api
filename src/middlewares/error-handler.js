function errorHandler(err, req, res, next) {
  console.error('FULL ERROR:', err);

  res.status(err.status || 500).json({
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'Something went wrong on the server.',
      stack: err.stack,
    },
  });
}

module.exports = errorHandler;