'use strict';

/**
 * OrderRepository Interface
 *
 * JavaScript has no `interface` keyword, so this class documents the
 * contract and throws if a concrete subclass forgets to implement a
 * method — a cheap substitute for compile-time interface checking.
 *
 * Use-cases require (depend on) THIS file's shape, never the concrete
 * `order.repository.json.js` directly via a hardcoded import — they
 * receive a repository instance via constructor injection. Swapping
 * to Mongo means writing `order.repository.mongo.js` that satisfies
 * this same contract; zero use-case files change.
 */
class OrderRepositoryInterface {
  // eslint-disable-next-line no-unused-vars
  async getAll(filters) {
    throw new Error('OrderRepositoryInterface.getAll() not implemented');
  }

  // eslint-disable-next-line no-unused-vars
  async getById(id) {
    throw new Error('OrderRepositoryInterface.getById() not implemented');
  }

  // eslint-disable-next-line no-unused-vars
  async create(order) {
    throw new Error('OrderRepositoryInterface.create() not implemented');
  }

  // eslint-disable-next-line no-unused-vars
  async update(order) {
    throw new Error('OrderRepositoryInterface.update() not implemented');
  }
}

module.exports = OrderRepositoryInterface;
