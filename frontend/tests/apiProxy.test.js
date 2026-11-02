import assert from 'node:assert/strict'
import process from 'node:process'
import { afterEach, test } from 'node:test'
import proxyRequest from '../api/proxy.js'

const originalBackendUrl = process.env.BACKEND_URL
const originalFetch = globalThis.fetch

afterEach(() => {
  if (originalBackendUrl === undefined) delete process.env.BACKEND_URL
  else process.env.BACKEND_URL = originalBackendUrl
  globalThis.fetch = originalFetch
})

const createResponse = () => {
  const headers = {}
  return {
    headers,
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code
      return this
    },
    setHeader(name, value) {
      headers[name.toLowerCase()] = value
    },
    send(value) {
      this.body = value
      return this
    },
    json(value) {
      this.body = value
      return this
    },
  }
}

test('proxies API requests to server-only BACKEND_URL and forwards auth headers', async () => {
  process.env.BACKEND_URL = 'https://private-api.example.com'
  let fetchUrl
  let fetchOptions
  globalThis.fetch = async (url, options) => {
    fetchUrl = url
    fetchOptions = options
    return new Response(JSON.stringify({ success: true }), {
      status: 201,
      headers: {
        'content-type': 'application/json',
        'set-cookie': 'token=opaque; HttpOnly; Secure',
      },
    })
  }

  const response = createResponse()
  await proxyRequest({
    method: 'POST',
    url: '/api/proxy?path=auth%2Flogin&source=web',
    headers: {
      'content-type': 'application/json',
      cookie: 'csrf-token=opaque',
      origin: 'https://keynest.example.com',
    },
    body: { email: 'user@example.com', password: 'secret' },
  }, response)

  assert.equal(fetchUrl, 'https://private-api.example.com/api/auth/login?source=web')
  assert.equal(fetchOptions.headers.get('origin'), 'https://keynest.example.com')
  assert.equal(fetchOptions.headers.get('cookie'), 'csrf-token=opaque')
  assert.equal(fetchOptions.body, JSON.stringify({
    email: 'user@example.com',
    password: 'secret',
  }))
  assert.equal(response.statusCode, 201)
  assert.equal(response.headers['cache-control'], 'no-store')
  assert.deepEqual(response.headers['set-cookie'], ['token=opaque; HttpOnly; Secure'])
})

test('rejects a missing backend URL without contacting an upstream', async () => {
  delete process.env.BACKEND_URL
  let fetchCalled = false
  globalThis.fetch = async () => {
    fetchCalled = true
  }
  const response = createResponse()

  await proxyRequest({
    method: 'GET',
    url: '/api/auth/me',
    headers: {},
  }, response)

  assert.equal(fetchCalled, false)
  assert.equal(response.statusCode, 500)
  assert.deepEqual(response.body, {
    success: false,
    message: 'Service configuration error.',
  })
})
