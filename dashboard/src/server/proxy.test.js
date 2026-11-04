import test from 'node:test'
import assert from 'node:assert/strict'
import { createApiProxy } from '../../api/proxy.js'

const logger = { error() {} }

const makeResponse = () => ({
  statusCode: null,
  headers: {},
  body: null,
  status(code) {
    this.statusCode = code
    return this
  },
  setHeader(name, value) {
    this.headers[name.toLowerCase()] = value
  },
  send(body) {
    this.body = body
    return this
  },
})

test('proxies API path, query, cookies, origin, request body, and response cookies', async () => {
  const response = makeResponse()
  let upstreamUrl
  let upstreamOptions
  const handler = createApiProxy({
    backendUrl: 'https://api.example.com',
    fetchImpl: async (url, options) => {
      upstreamUrl = url
      upstreamOptions = options
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': 'token=opaque; HttpOnly; Secure; SameSite=Lax; Path=/',
        },
      })
    },
  })

  await handler({
    method: 'POST',
    url: '/api/proxy?__api_path=auth%2Flogin&source=admin',
    headers: {
      cookie: 'token=old',
      origin: 'https://admin.example.com',
      'content-type': 'application/json',
      host: 'admin.example.com',
    },
    body: { email: 'admin@example.com', password: 'secret' },
  }, response)

  assert.equal(upstreamUrl.toString(), 'https://api.example.com/api/auth/login?source=admin')
  assert.equal(upstreamOptions.method, 'POST')
  assert.equal(upstreamOptions.headers.get('cookie'), 'token=old')
  assert.equal(upstreamOptions.headers.get('origin'), 'https://admin.example.com')
  assert.equal(upstreamOptions.headers.has('host'), false)
  assert.equal(upstreamOptions.body, JSON.stringify({ email: 'admin@example.com', password: 'secret' }))
  assert.equal(response.statusCode, 200)
  assert.equal(response.headers['cache-control'], 'no-store')
  assert.match(response.headers['set-cookie'][0], /HttpOnly/)
  assert.equal(response.body.toString(), '{"success":true}')
})

test('rejects non-API paths and methods and reports missing backend configuration', async () => {
  const handler = createApiProxy({
    backendUrl: 'https://api.example.com',
    logger,
  })
  const wrongPath = makeResponse()
  await handler({ method: 'GET', url: '/api/proxy', query: {}, headers: {} }, wrongPath)
  assert.equal(wrongPath.statusCode, 404)

  const wrongMethod = makeResponse()
  await handler({
    method: 'TRACE',
    url: '/api/proxy?__api_path=auth%2Fme',
    headers: {},
  }, wrongMethod)
  assert.equal(wrongMethod.statusCode, 405)
  assert.match(wrongMethod.headers.allow, /GET/)

  const notConfigured = makeResponse()
  await createApiProxy({ backendUrl: '', logger })({
    method: 'GET',
    url: '/api/proxy?__api_path=auth%2Fme',
    headers: {},
  }, notConfigured)
  assert.equal(notConfigured.statusCode, 500)
  assert.deepEqual(JSON.parse(notConfigured.body), {
    success: false,
    message: 'The service is not configured.',
  })
})

test('requires HTTPS for non-local backend URLs', async () => {
  const response = makeResponse()
  await createApiProxy({ backendUrl: 'http://api.example.com', logger })({
    method: 'GET',
    url: '/api/proxy?__api_path=auth%2Fme',
    headers: {},
  }, response)
  assert.equal(response.statusCode, 500)
})

test('rejects missing and traversal proxy paths', async () => {
  const handler = createApiProxy({
    backendUrl: 'https://api.example.com',
    logger,
    fetchImpl: async () => {
      assert.fail('Invalid paths must not be forwarded.')
    },
  })

  for (const url of [
    '/api/proxy',
    '/api/proxy?__api_path=..%2Fauth%2Fme',
    '/api/proxy?__api_path=auth%2F..%2Fme',
    '/api/proxy?__api_path=auth%5Cme',
  ]) {
    const response = makeResponse()
    await handler({ method: 'GET', url, headers: {} }, response)
    assert.equal(response.statusCode, 404)
  }
})
