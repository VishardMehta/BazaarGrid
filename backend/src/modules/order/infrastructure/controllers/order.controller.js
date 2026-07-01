'use strict';

const { createOrderSchema, updateStatusSchema, orderQuerySchema } = require('../validators/order.schema');
const { toCreateOrderInput } = require('../dto/create-order.dto');

/**
 * OrderController
 *
 * Strictly an HTTP adapter: parse request, call service, shape
 * response. No business rules, no transition checks, no fs. Every
 * method is intentionally short — if a method here starts growing
 * if/else branches about order state, that logic has leaked from
 * the wrong layer and belongs in a use case instead.
 */
class OrderController {
  /**
   * @param {import('../../application/services/order.service')} orderService
   */
  constructor(orderService) {
    this.orderService = orderService;

    // Bind methods so they can be passed directly as Express handlers
    // without losing `this`.
    this.getOrders = this.getOrders.bind(this);
    this.getOrderById = this.getOrderById.bind(this);
    this.createOrder = this.createOrder.bind(this);
    this.updateOrderStatus = this.updateOrderStatus.bind(this);
    this.cancelOrder = this.cancelOrder.bind(this);
  }

  async getOrders(req, res) {
    const filters = orderQuerySchema.parse(req.query);
    const orders = await this.orderService.getOrders(filters);
    res.status(200).json({
      data: orders.map((o) => o.toJSON()),
      count: orders.length,
    });
  }

  async getOrderById(req, res) {
    const order = await this.orderService.getOrder(req.params.id);
    res.status(200).json({ data: order.toJSON() });
  }

  async createOrder(req, res) {
    const validatedBody = createOrderSchema.parse(req.body);
    const input = toCreateOrderInput(validatedBody);
    const order = await this.orderService.createOrder(input);
    res.status(201).json({ data: order.toJSON() });
  }

  async updateOrderStatus(req, res) {
    const { status } = updateStatusSchema.parse(req.body);
    const order = await this.orderService.updateOrderStatus(req.params.id, status);
    res.status(200).json({ data: order.toJSON() });
  }

  async cancelOrder(req, res) {
    const order = await this.orderService.cancelOrder(req.params.id);
    res.status(200).json({ data: order.toJSON() });
  }
}

module.exports = OrderController;
