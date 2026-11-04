import test from 'node:test'
import assert from 'node:assert/strict'
import { ApiError, requestApi } from './apiClient.js'

const withMockFetch = async (handler, callback) => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = handler
  try {
    await callback()
  } finally {
    globalThis.fetch = originalFetch
  }
}

test('sends same-origin cookie requests and serializes JSON bodies', async () => {
  await withMockFetch(async (path, options) => {
    assert.equal(path, '/api/auth/login')
    assert.equal(options.method, 'POST')
    assert.equal(options.credentials, 'include')
    assert.equal(options.cache, 'no-store')
    assert.equal(options.headers['Content-Type'], 'application/json')
    assert.equal(options.body, JSON.stringify({ email: 'admin@example.com', password: 'secret' }))
    return new Response(JSON.stringify({ success: true, user: { role: 'admin' } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }, async () => {
    const result = await requestApi('/api/auth/login', {
      method: 'POST',
      body: { email: 'admin@example.com', password: 'secret' },
    })
    assert.deepEqual(result.user, { role: 'admin' })
  })
})

test('converts unsuccessful API responses to ApiError with server message', async () => {
  await withMockFetch(async () => new Response(JSON.stringify({
    success: false,
    message: 'Admin role required.',
  }), {
    status: 403,
    headers: { 'Content-Type': 'application/json' },
  }), async () => {
    await assert.rejects(requestApi('/api/admin/users'), (error) => {
      assert.ok(error instanceof ApiError)
      assert.equal(error.status, 403)
      assert.equal(error.message, 'Admin role required.')
      return true
    })
  })
})

test('reports unexpected non-JSON responses and network failures explicitly', async () => {
  await withMockFetch(async () => new Response('<html>bad gateway</html>', { status: 502 }), async () => {
    await assert.rejects(requestApi('/api/admin/users'), {
      name: 'ApiError',
      status: 502,
      message: 'The service returned an unexpected response.',
    })
  })

  await withMockFetch(async () => {
    throw new TypeError('network failure')
  }, async () => {
    await assert.rejects(requestApi('/api/admin/users'), {
      name: 'ApiError',
      status: null,
      message: 'Could not reach the service. Check your connection and try again.',
    })
  })
})
