'use strict';

const CreateOrderUseCase = require('../use-cases/create-order.usecase');
const UpdateOrderStatusUseCase = require('../use-cases/update-order-status.usecase');
const CancelOrderUseCase = require('../use-cases/cancel-order.usecase');
const GetOrderUseCase = require('../use-cases/get-order.usecase');
const GetOrdersUseCase = require('../use-cases/get-orders.usecase');

/**
 * OrderService
 *
 * A thin facade that composes the individual use cases behind one
 * object, so the controller has a single dependency instead of five.
 * This is purely a wiring/ergonomics layer — it contains NO business
 * logic of its own. If you're tempted to add an `if` statement here,
 * it belongs in a use case instead.
 *
 * In a NestJS port, this class becomes an `@Injectable()` service and
 * the use cases become its injected collaborators (or are inlined as
 * private methods, depending on how granular you want DI to be).
 */
class OrderService {
  /**
   * @param {import('../repositories/order.repository.interface')} orderRepository
   */
  constructor(orderRepository) {
    this.createOrderUseCase = new CreateOrderUseCase(orderRepository);
    this.updateOrderStatusUseCase = new UpdateOrderStatusUseCase(orderRepository);
    this.cancelOrderUseCase = new CancelOrderUseCase(orderRepository);
    this.getOrderUseCase = new GetOrderUseCase(orderRepository);
    this.getOrdersUseCase = new GetOrdersUseCase(orderRepository);
  }

  createOrder(input) {
    return this.createOrderUseCase.execute(input);
  }

  updateOrderStatus(orderId, nextStatus, options) {
    return this.updateOrderStatusUseCase.execute(orderId, nextStatus, options);
  }

  cancelOrder(orderId) {
    return this.cancelOrderUseCase.execute(orderId);
  }

  getOrder(orderId) {
    return this.getOrderUseCase.execute(orderId);
  }

  getOrders(filters) {
    return this.getOrdersUseCase.execute(filters);
  }
}

module.exports = OrderService;
