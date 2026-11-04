import test from 'node:test'
import assert from 'node:assert/strict'
import { isAdminAccount } from './adminAccount.js'

test('accepts only users with the admin role', () => {
  assert.equal(isAdminAccount({ id: '1', email: 'admin@example.com', role: 'admin' }), true)
  assert.equal(isAdminAccount({ id: '2', email: 'user@example.com', role: 'user' }), false)
  assert.equal(isAdminAccount({ id: '1', role: 'admin' }), false)
  assert.equal(isAdminAccount({ id: '1', email: '', role: 'admin' }), false)
  assert.equal(isAdminAccount(null), false)
  assert.equal(isAdminAccount(undefined), false)
})
