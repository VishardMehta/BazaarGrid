'use strict';

const { ORDER_STATUS, ACTOR_ROLE } = require('../../constants/order.constants');

/**
 * Order Role Policy
 *
 * The spec separates "what transitions exist" (order-status.policy.js)
 * from "who is allowed to trigger them" (this file). Today, no caller
 * actually passes a role yet — there's no auth layer in this task — but
 * the use cases are written to accept an optional actorRole so that
 * wiring in real auth later is a one-line change at the controller,
 * not a redesign of the use case.
 *
 * Role -> allowed transition mapping:
 *   FULFILLING_SELLER (Producer or Local Store): PLACED -> CONFIRMED -> PACKED -> FULFILLED
 *   CUSTOMER:                                     FULFILLED -> COMPLETED
 *   SYSTEM:                                       any -> CANCELLED (admin/ops override)
 */
const ROLE_TRANSITIONS = Object.freeze({
  [ACTOR_ROLE.FULFILLING_SELLER]: [
    { from: ORDER_STATUS.PLACED, to: ORDER_STATUS.CONFIRMED },
    { from: ORDER_STATUS.CONFIRMED, to: ORDER_STATUS.PACKED },
    { from: ORDER_STATUS.PACKED, to: ORDER_STATUS.FULFILLED },
  ],
  [ACTOR_ROLE.CUSTOMER]: [
    { from: ORDER_STATUS.FULFILLED, to: ORDER_STATUS.COMPLETED },
  ],
  [ACTOR_ROLE.SYSTEM]: [
    { from: ORDER_STATUS.PLACED, to: ORDER_STATUS.CANCELLED },
    { from: ORDER_STATUS.CONFIRMED, to: ORDER_STATUS.CANCELLED },
    { from: ORDER_STATUS.PACKED, to: ORDER_STATUS.CANCELLED },
  ],
});

/**
 * @param {string|null} actorRole - null means "role checking not enforced" (current default)
 * @param {string} currentStatus
 * @param {string} nextStatus
 * @returns {boolean}
 */
function isTransitionAllowedForRole(actorRole, currentStatus, nextStatus) {
  if (!actorRole) return true; // role enforcement is opt-in until auth exists
  const rules = ROLE_TRANSITIONS[actorRole];
  if (!rules) return false;
  return rules.some((rule) => rule.from === currentStatus && rule.to === nextStatus);
}

module.exports = {
  ROLE_TRANSITIONS,
  isTransitionAllowedForRole,
};
