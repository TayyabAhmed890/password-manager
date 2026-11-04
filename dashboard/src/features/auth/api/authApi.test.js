import test from 'node:test'
import assert from 'node:assert/strict'
import { ApiError } from '../../../shared/lib/apiClient.js'
import {
  changeAdminPassword,
  deleteAdminProfile,
  loginAdmin,
  resetAdminPassword,
} from './authApi.js'

const withMockFetch = async (handler, callback) => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = handler
  try {
    await callback()
  } finally {
    globalThis.fetch = originalFetch
  }
}

test('admin login submits credentials to the auth API and returns the admin session', async () => {
  await withMockFetch(async (path, options) => {
    assert.equal(path, '/api/auth/login')
    assert.equal(options.method, 'POST')
    assert.equal(options.credentials, 'include')
    assert.deepEqual(JSON.parse(options.body), {
      email: 'admin@example.com',
      password: 'current-password',
    })
    return Response.json({ success: true, user: { id: 'admin-1', role: 'admin' } })
  }, async () => {
    const result = await loginAdmin({ email: 'admin@example.com', password: 'current-password' })
    assert.deepEqual(result.user, { id: 'admin-1', role: 'admin' })
  })
})

test('admin password reset and change forward fields and return the replacement recovery code', async () => {
  const scenarios = [
    {
      method: resetAdminPassword,
      path: '/api/auth/admin/forgot-password',
      body: {
        email: 'admin@example.com',
        recoveryCode: 'ABCD-EFGH',
        newPassword: 'new-password',
      },
    },
    {
      method: changeAdminPassword,
      path: '/api/auth/admin/change-password',
      body: { currentPassword: 'old-password', newPassword: 'new-password' },
    },
  ]

  for (const { method, path, body } of scenarios) {
    await withMockFetch(async (requestPath, options) => {
      assert.equal(requestPath, path)
      assert.equal(options.method, 'POST')
      assert.deepEqual(JSON.parse(options.body), body)
      return Response.json({ success: true, newRecoveryCode: 'ABCD-EFGH-IJKL' })
    }, async () => {
      const result = await method(body)
      assert.equal(result.newRecoveryCode, 'ABCD-EFGH-IJKL')
    })
  }
})

test('admin profile deletion sends the current password and reports server failures', async () => {
  await withMockFetch(async (path, options) => {
    assert.equal(path, '/api/auth/admin/profile')
    assert.equal(options.method, 'DELETE')
    assert.equal(options.credentials, 'include')
    assert.deepEqual(JSON.parse(options.body), { currentPassword: 'current-password' })
    return Response.json({ success: true, message: 'Admin profile deleted.' })
  }, async () => {
    const result = await deleteAdminProfile('current-password')
    assert.equal(result.message, 'Admin profile deleted.')
  })

  await withMockFetch(async () => Response.json({
    success: false,
    message: 'Current password is incorrect.',
  }, { status: 401 }), async () => {
    await assert.rejects(deleteAdminProfile('wrong-password'), (error) => {
      assert.ok(error instanceof ApiError)
      assert.equal(error.status, 401)
      assert.equal(error.message, 'Current password is incorrect.')
      return true
    })
  })
})
