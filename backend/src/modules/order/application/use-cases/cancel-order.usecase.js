'use strict';

const { ORDER_STATUS, ACTOR_ROLE } = require('../../constants/order.constants');
const UpdateOrderStatusUseCase = require('./update-order-status.usecase');

/**
 * CancelOrderUseCase
 *
 * Deliberately implemented as a thin wrapper around
 * UpdateOrderStatusUseCase rather than a parallel code path. Cancelling
 * IS a status transition (-> CANCELLED); duplicating the transition
 * check here would risk the two rules drifting out of sync over time.
 * The dedicated PATCH /orders/:id/cancel endpoint exists for a cleaner
 * API surface (per spec), but underneath it's the same guarded
 * transition logic.
 */
class CancelOrderUseCase {
  /**
   * @param {import('../repositories/order.repository.interface')} orderRepository
   */
  constructor(orderRepository) {
    this.updateOrderStatusUseCase = new UpdateOrderStatusUseCase(orderRepository);
  }

  async execute(orderId) {
    return this.updateOrderStatusUseCase.execute(orderId, ORDER_STATUS.CANCELLED, {
      actorRole: ACTOR_ROLE.SYSTEM,
    });
  }
}

module.exports = CancelOrderUseCase;
