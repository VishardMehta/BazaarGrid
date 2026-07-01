'use strict';

const { ORDER_STATUS } = require('../../constants/order.constants');

/**
 * Order Status Policy
 *
 * This is the ONLY place in the entire codebase that knows which status
 * transitions are legal. Controllers, use-cases, and the UI all defer
 * to this map — nobody hardcodes "if status is PLACED and next is
 * CONFIRMED..." anywhere else.
 *
 * Transition map (per spec):
 *   PLACED    -> CONFIRMED, CANCELLED
 *   CONFIRMED -> PACKED,    CANCELLED
 *   PACKED    -> FULFILLED
 *   FULFILLED -> COMPLETED
 *   COMPLETED -> (terminal, but see note on quality issues below)
 *   CANCELLED -> (terminal, no transitions out)
 *
 * Note: CONFIRMED/PACKED -> CANCELLED is allowed because real-world
 * orders get cancelled after confirmation (stock issues, customer
 * request) — the spec disallows CANCELLED as a source, not as a
 * destination from any non-terminal state. If you want cancellation
 * restricted to PLACED only, trim the CANCELLED entries below; the
 * single map is the only edit required.
 */
const TRANSITION_MAP = Object.freeze({
  [ORDER_STATUS.PLACED]: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.CONFIRMED]: [ORDER_STATUS.PACKED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.PACKED]: [ORDER_STATUS.FULFILLED],
  [ORDER_STATUS.FULFILLED]: [ORDER_STATUS.COMPLETED],
  [ORDER_STATUS.COMPLETED]: [], // terminal for the order lifecycle itself.
  // Future quality-issue flow is modeled as a SEPARATE state machine
  // hanging off a COMPLETED order (see domain/events/order-events.js),
  // not as a status value here — so this map never needs to change
  // when that feature ships.
  [ORDER_STATUS.CANCELLED]: [], // terminal, no transitions out.
});

/**
 * @param {string} currentStatus
 * @param {string} nextStatus
 * @returns {boolean}
 */
function canTransition(currentStatus, nextStatus) {
  const allowedNextStates = TRANSITION_MAP[currentStatus];
  if (!allowedNextStates) return false;
  return allowedNextStates.includes(nextStatus);
}

/**
 * @param {string} currentStatus
 * @returns {string[]} statuses reachable directly from currentStatus
 */
function getAllowedNextStatuses(currentStatus) {
  return TRANSITION_MAP[currentStatus] || [];
}

function isTerminal(status) {
  return getAllowedNextStatuses(status).length === 0;
}

module.exports = {
  TRANSITION_MAP,
  canTransition,
  getAllowedNextStatuses,
  isTerminal,
};
