'use strict';

const Order = require('../../domain/entities/order.entity');
const { publishOrderCreated } = require('../../domain/events/order-events');

/**
 * CreateOrderUseCase
 *
 * Single responsibility: take validated input, build a domain Order
 * (which self-validates its invariants), persist it, publish a
 * domain event, return it. No HTTP, no fs — those belong to the
 * controller and repository respectively.
 */
class CreateOrderUseCase {
  /**
   * @param {import('../repositories/order.repository.interface')} orderRepository
   */
  constructor(orderRepository) {
    this.orderRepository = orderRepository;
  }

  /**
   * @param {object} input - already shape-validated by Zod at the controller boundary
   * @returns {Promise<Order>}
   */
  async execute(input) {
    const order = new Order({
      orderType: input.orderType,
      buyerId: input.buyerId,
      sellerType: input.sellerType,
      fulfillingSellerId: input.fulfillingSellerId,
      items: input.items,
      channel: input.channel,
      fulfillmentMode: input.fulfillmentMode,
    });

    const created = await this.orderRepository.create(order);
    publishOrderCreated(created);
    return created;
  }
}

module.exports = CreateOrderUseCase;
