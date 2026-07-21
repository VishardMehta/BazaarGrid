'use strict';

/**
 * GetOrdersUseCase
 *
 * Accepts an optional filters object (e.g. { sellerType, orderType,
 * status, buyerId, fulfillingSellerId }) and passes it straight to the
 * repository. The repository decides how filtering is actually done
 * (in-memory array filter for JSON today, a Mongo query later) — the
 * use case stays storage-agnostic.
 */
class GetOrdersUseCase {
  /**
   * @param {import('../repositories/order.repository.interface')} orderRepository
   */
  constructor(orderRepository) {
    this.orderRepository = orderRepository;
  }

  async execute(filters = {}) {
    return this.orderRepository.getAll(filters);
  }
}

module.exports = GetOrdersUseCase;
