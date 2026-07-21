'use strict';

const { NotFoundError, InvalidTransitionError } = require('../../../../shared/errors/app-error');
const { canTransition } = require('../../domain/policies/order-status.policy');
const { isTransitionAllowedForRole } = require('../../domain/policies/order-role.policy');
const { publishOrderStatusChanged } = require('../../domain/events/order-events');

/**
 * UpdateOrderStatusUseCase
 *
 * This is where "Do NOT hardcode transition logic in controllers"
 * is actually honored: the controller calls execute(orderId, nextStatus),
 * and ALL of the decision-making (is this transition legal? is this
 * actor allowed to make it?) happens here by delegating to policies.
 *
 * actorRole is optional and unused by today's routes (no auth yet),
 * but accepting it now means tomorrow's auth middleware can pass
 * req.user.role straight through with no signature change.
 */
class UpdateOrderStatusUseCase {
  /**
   * @param {import('../repositories/order.repository.interface')} orderRepository
   */
  constructor(orderRepository) {
    this.orderRepository = orderRepository;
  }

  /**
   * @param {string} orderId
   * @param {string} nextStatus
   * @param {{ actorRole?: string }} [options]
   */
  async execute(orderId, nextStatus, options = {}) {
    const { actorRole = null } = options;

    const order = await this.orderRepository.getById(orderId);
    if (!order) {
      throw new NotFoundError(`Order with id "${orderId}" not found`);
    }

    const currentStatus = order.status;

    if (!canTransition(currentStatus, nextStatus)) {
      throw new InvalidTransitionError(
        `Cannot transition order from "${currentStatus}" to "${nextStatus}"`
      );
    }

    if (!isTransitionAllowedForRole(actorRole, currentStatus, nextStatus)) {
      throw new InvalidTransitionError(
        `Role "${actorRole}" is not permitted to move order from "${currentStatus}" to "${nextStatus}"`
      );
    }

    order.applyStatus(nextStatus);
    const updated = await this.orderRepository.update(order);

    publishOrderStatusChanged(updated, currentStatus);

    return updated;
  }
}

module.exports = UpdateOrderStatusUseCase;
