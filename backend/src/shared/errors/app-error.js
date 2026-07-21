'use strict';

/**
 * Base class for all predictable, "expected" application errors.
 *
 * WHY: Domain/use-case code should never know about HTTP status codes.
 * Instead, it throws semantically-named errors (NotFoundError,
 * InvalidTransitionError, etc.), and the HTTP layer (middleware) maps
 * those to status codes. This keeps domain code framework-agnostic —
 * critical for the Express -> NestJS migration goal, since NestJS uses
 * exception filters that can map these same error classes too.
 */
class AppError extends Error {
  constructor(message, code = 'APP_ERROR') {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.isOperational = true; // distinguishes "expected" errors from bugs/crashes
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 'NOT_FOUND');
  }
}

class ValidationError extends AppError {
  constructor(message = 'Validation failed', details = []) {
    super(message, 'VALIDATION_ERROR');
    this.details = details;
  }
}

class InvalidTransitionError extends AppError {
  constructor(message = 'Invalid status transition') {
    super(message, 'INVALID_TRANSITION');
  }
}

class ConflictError extends AppError {
  constructor(message = 'Conflicting state') {
    super(message, 'CONFLICT');
  }
}

module.exports = {
  AppError,
  NotFoundError,
  ValidationError,
  InvalidTransitionError,
  ConflictError,
};
