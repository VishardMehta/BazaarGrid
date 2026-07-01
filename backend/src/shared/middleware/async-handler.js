'use strict';

/**
 * Wraps an async Express route handler so rejected promises are
 * forwarded to next(err) automatically. Without this, every controller
 * method needs its own try/catch, which is exactly the kind of
 * repetitive boilerplate that invites copy-paste bugs (forgetting one
 * catch block silently swallows an unhandled rejection).
 */
function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = { asyncHandler };
