'use strict';

const { ZodError } = require('zod');
const { AppError } = require('../errors/app-error');

/**
 * Central Error Handler
 *
 * This is the single place that decides "AppError subclass X becomes
 * HTTP status Y." Controllers never set status codes for error cases
 * themselves — they just throw, and let this middleware translate.
 * That's what keeps the domain/use-case layers ignorant of HTTP, and
 * is exactly the kind of mapping a NestJS exception filter would
 * replace this with, 1:1.
 */
const ERROR_CODE_TO_HTTP_STATUS = {
  VALIDATION_ERROR: 400,
  NOT_FOUND: 404,
  INVALID_TRANSITION: 409,
  CONFLICT: 409,
  APP_ERROR: 400,
};

// eslint-disable-next-line no-unused-vars
function errorHandlerMiddleware(err, req, res, next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: err.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      },
    });
  }

  if (err instanceof AppError) {
    const status = ERROR_CODE_TO_HTTP_STATUS[err.code] || 400;
    return res.status(status).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    });
  }

  // Unexpected/programmer error — log full detail server-side, but
  // never leak internals to the client.
  // eslint-disable-next-line no-console
  console.error('Unexpected error:', err);
  return res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    },
  });
}

module.exports = { errorHandlerMiddleware };
