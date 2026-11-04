import test from 'node:test'
import assert from 'node:assert/strict'
import { ApiError } from './apiClient.js'
import { isExpiredSessionError } from './authErrors.js'

test('distinguishes expired sessions from expected credential errors', () => {
  assert.equal(isExpiredSessionError(new ApiError(401, 'Invalid or expired authentication session.')), true)
  assert.equal(isExpiredSessionError(
    new ApiError(401, 'Current password is incorrect.'),
    ['Current password is incorrect.'],
  ), false)
  assert.equal(isExpiredSessionError(new ApiError(403, 'Admin access required.')), false)
  assert.equal(isExpiredSessionError(new Error('Unauthorized')), false)
})
