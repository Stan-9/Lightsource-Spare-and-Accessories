/**
 * Access Control for Procurement Module
 *
 * Currently treats manager and cashier as identical access level (any authenticated admin).
 * Isolated into a single helper so role-based restrictions can be updated in one place later.
 *
 * @param {object|null} user - Firebase Auth user object
 * @returns {boolean}
 */
export const canAccessProcurement = (user) => {
  return Boolean(user && user.uid);
};
