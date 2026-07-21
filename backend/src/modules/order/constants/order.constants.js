'use strict';

/**
 * Centralized vocabulary for the Order domain.
 *
 * WHY THIS FILE EXISTS:
 * Magic strings ("PLACED", "PRODUCER", etc.) scattered across controllers,
 * services, and validators are how typos become production bugs.
 * Every other file in this module imports from here instead of
 * hardcoding string literals.
 */

const ORDER_TYPE = Object.freeze({
  CUSTOMER_ORDER: 'CUSTOMER_ORDER',
  RESTOCK_ORDER: 'RESTOCK_ORDER',
});

const SELLER_TYPE = Object.freeze({
  PRODUCER: 'PRODUCER',
  LOCAL_STORE: 'LOCAL_STORE',
});

const CHANNEL = Object.freeze({
  APP: 'APP',
  WHATSAPP: 'WHATSAPP',
});

const FULFILLMENT_MODE = Object.freeze({
  DELIVERY: 'DELIVERY',
  PICKUP: 'PICKUP',
});

const ORDER_STATUS = Object.freeze({
  PLACED: 'PLACED',
  CONFIRMED: 'CONFIRMED',
  PACKED: 'PACKED',
  FULFILLED: 'FULFILLED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
});

/**
 * Roles permitted to act on an order. Kept here (not invented ad hoc in
 * policies) because role-gated transitions are a named, first-class concept
 * in this domain per the "Role Based Lifecycle" requirement.
 */
const ACTOR_ROLE = Object.freeze({
  FULFILLING_SELLER: 'FULFILLING_SELLER', // PRODUCER or LOCAL_STORE acting as fulfiller
  CUSTOMER: 'CUSTOMER',
  SYSTEM: 'SYSTEM', // e.g. cancellation triggered by admin/system, not lifecycle role
});

module.exports = {
  ORDER_TYPE,
  SELLER_TYPE,
  CHANNEL,
  FULFILLMENT_MODE,
  ORDER_STATUS,
  ACTOR_ROLE,
};
