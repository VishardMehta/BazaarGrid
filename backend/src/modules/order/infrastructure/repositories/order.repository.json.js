'use strict';

const OrderRepositoryInterface = require('../../application/repositories/order.repository.interface');
const Order = require('../../domain/entities/order.entity');
const JsonFileClient = require('./json/json-file.client');

/**
 * OrderRepositoryJson
 *
 * Implements OrderRepositoryInterface against a JSON file. This is the
 * ONLY class (besides JsonFileClient) that knows orders live in a file
 * called orders.json. Use cases never see this class directly — they
 * receive an instance typed as the interface.
 *
 * Responsibilities:
 *   1. Talk to JsonFileClient for raw read/write.
 *   2. Map raw JSON records <-> Order domain entities.
 *
 * To migrate to MongoDB: create OrderRepositoryMongo implementing the
 * same interface, swap the instantiation in the composition root
 * (app.js), done. No use case, controller, or route changes.
 */
class OrderRepositoryJson extends OrderRepositoryInterface {
  /**
   * @param {string} filePath
   */
  constructor(filePath) {
    super();
    this.client = new JsonFileClient(filePath);
  }

  async getAll(filters = {}) {
    const records = await this.client.readAll();
    let orders = records.map((record) => this._toEntity(record));

    if (filters.sellerType) {
      orders = orders.filter((o) => o.sellerType === filters.sellerType);
    }
    if (filters.orderType) {
      orders = orders.filter((o) => o.orderType === filters.orderType);
    }
    if (filters.status) {
      orders = orders.filter((o) => o.status === filters.status);
    }
    if (filters.buyerId) {
      orders = orders.filter((o) => o.buyerId === filters.buyerId);
    }
    if (filters.fulfillingSellerId) {
      orders = orders.filter((o) => o.fulfillingSellerId === filters.fulfillingSellerId);
    }
    if (filters.channel) {
      orders = orders.filter((o) => o.channel === filters.channel);
    }

    return orders;
  }

  async getById(id) {
    const records = await this.client.readAll();
    const record = records.find((r) => r.id === id);
    return record ? this._toEntity(record) : null;
  }

  async create(order) {
    const records = await this.client.readAll();
    records.push(order.toJSON());
    await this.client.writeAll(records);
    return order;
  }

  async update(order) {
    const records = await this.client.readAll();
    const index = records.findIndex((r) => r.id === order.id);
    if (index === -1) {
      throw new Error(`Cannot update order "${order.id}": not found in store`);
    }
    records[index] = order.toJSON();
    await this.client.writeAll(records);
    return order;
  }

  /**
   * Reconstructs a domain Order from a raw JSON record. Goes through
   * the Order constructor so the same invariants apply to data coming
   * FROM storage as data coming INTO it — guards against corrupted or
   * hand-edited orders.json entries.
   */
  _toEntity(record) {
    return new Order({
      id: record.id,
      orderType: record.orderType,
      buyerId: record.buyerId,
      sellerType: record.sellerType,
      fulfillingSellerId: record.fulfillingSellerId,
      items: record.items,
      channel: record.channel,
      fulfillmentMode: record.fulfillmentMode,
      status: record.status,
      total: record.total,
      hasQualityIssue: record.hasQualityIssue,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      statusHistory: record.statusHistory,
    });
  }
}

module.exports = OrderRepositoryJson;
