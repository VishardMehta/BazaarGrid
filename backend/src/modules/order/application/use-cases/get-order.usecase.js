'use strict';

const { NotFoundError } = require('../../../../shared/errors/app-error');

class GetOrderUseCase {
  /**
   * @param {import('../repositories/order.repository.interface')} orderRepository
   */
  constructor(orderRepository) {
    this.orderRepository = orderRepository;
  }

  async execute(orderId) {
    const order = await this.orderRepository.getById(orderId);
    if (!order) {
      throw new NotFoundError(`Order with id "${orderId}" not found`);
    }
    return order;
  }
}

module.exports = GetOrderUseCase;
