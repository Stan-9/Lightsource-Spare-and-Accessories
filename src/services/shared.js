/**
 * @file shared.js
 * @description Shared utilities for all service modules.
 *
 * Centralises the `result` response wrapper so every service module
 * returns a consistent `{ success, data, error }` shape without
 * copy-pasting the factory.
 */

/**
 * Standard service-layer response envelope.
 *
 * @template T
 * @param {boolean} success - Whether the operation succeeded.
 * @param {T|null}  [data]  - Payload returned on success.
 * @param {string|null} [error] - Human-readable error message on failure.
 * @returns {{ success: boolean, data: T|null, error: string|null }}
 */
export const result = (success, data = null, error = null) => ({
  success,
  data,
  error,
});
