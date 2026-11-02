import assert from 'node:assert/strict'
import test from 'node:test'
import {
  AuthApiError,
  changeAccountPassword,
  deleteAccount,
  getCurrentUser,
  getAuthErrorMessage,
  loginAccount,
  logoutAccount,
  registerAccount,
  resetPassword,
} from '../src/features/auth/api/authApi.js'
import {
  createVaultEntry,
  deleteVaultEntry,
  getVaultEntries,
  revealVaultEntry,
  updateVaultEntryPassword,
} from '../src/features/vault/api/vaultApi.js'

const createResponse = ({
  status = 200,
  body = { success: true },
  retryAfter = null,
  invalidJson = false,
} = {}) => ({
  ok: status >= 200 && status < 300,
  status,
  headers: {
    get: (name) => name === 'Retry-After' ? retryAfter : null,
  },
  json: async () => {
    if (invalidJson) {
      throw new SyntaxError('Invalid JSON')
    }

    return body
  },
})

test('auth operations post credentials to their routes with cookie credentials', async () => {
  const originalFetch = globalThis.fetch
  const requests = []
  globalThis.fetch = async (url, options) => {
    requests.push({ url, options })
    return createResponse({ body: { success: true, recoveryCode: 'code' } })
  }

  try {
    await registerAccount({
      name: 'Amina Rahman',
      email: 'new@example.com',
      password: 'passphrase',
    })
    await loginAccount({ email: 'new@example.com', password: 'passphrase' })
    await resetPassword({
      email: 'new@example.com',
      recoveryCode: 'recovery',
      newPassword: 'new-passphrase',
    })

    assert.deepEqual(requests.map(({ url }) => url), [
      '/api/auth/register',
      '/api/auth/login',
      '/api/auth/forgot-password',
    ])
    for (const { options } of requests) {
      assert.equal(options.method, 'POST')
      assert.equal(options.credentials, 'include')
      assert.equal(options.cache, 'no-store')
      assert.equal(options.headers['Content-Type'], 'application/json')
    }
    assert.deepEqual(JSON.parse(requests[2].options.body), {
      email: 'new@example.com',
      recoveryCode: 'recovery',
      newPassword: 'new-passphrase',
    })
    assert.deepEqual(JSON.parse(requests[0].options.body), {
      name: 'Amina Rahman',
      email: 'new@example.com',
      password: 'passphrase',
    })
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('auth requests return the successful response body', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => createResponse({
    body: { success: true, recoveryCode: 'one-time-code' },
  })

  try {
    assert.deepEqual(await registerAccount({ email: 'user@example.com' }), {
      success: true,
      recoveryCode: 'one-time-code',
    })
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('session, account, and vault operations use their protected API routes', async () => {
  const originalFetch = globalThis.fetch
  const requests = []
  globalThis.fetch = async (url, options) => {
    requests.push({ url, options })
    return createResponse({ body: { success: true, data: [] } })
  }

  try {
    await getCurrentUser()
    await logoutAccount()
    await changeAccountPassword({
      currentPassword: 'current',
      newPassword: 'NextPass!word',
    })
    await deleteAccount({ currentPassword: 'current' })
    await getVaultEntries()
    await createVaultEntry({
      website: 'example.com',
      email: 'user@example.com',
      password: 'stored password',
    })
    await revealVaultEntry('entry-123')
    await updateVaultEntryPassword('entry-123', 'UpdatedVault!Pass')
    await deleteVaultEntry('entry-123')

    assert.deepEqual(requests.map(({ url, options }) => [url, options.method]), [
      ['/api/auth/me', 'GET'],
      ['/api/auth/logout', 'POST'],
      ['/api/auth/change-password', 'POST'],
      ['/api/auth/account', 'DELETE'],
      ['/api/store', 'GET'],
      ['/api/store/create', 'POST'],
      ['/api/store/entry-123/password', 'GET'],
      ['/api/store/entry-123', 'PATCH'],
      ['/api/store/entry-123', 'DELETE'],
    ])
    for (const { options } of requests) {
      assert.equal(options.credentials, 'include')
      assert.equal(options.cache, 'no-store')
    }
    assert.deepEqual(JSON.parse(requests[3].options.body), {
      currentPassword: 'current',
    })
    assert.deepEqual(JSON.parse(requests[7].options.body), {
      password: 'UpdatedVault!Pass',
    })
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('auth errors retain status and Retry-After without exposing response text', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => createResponse({
    status: 429,
    retryAfter: '125',
    body: { success: false, message: 'internal response detail' },
  })

  try {
    await assert.rejects(
      loginAccount({ email: 'user@example.com', password: 'bad' }),
      (error) => {
        assert.ok(error instanceof AuthApiError)
        assert.equal(error.status, 429)
        assert.equal(error.retryAfterSeconds, 125)
        assert.equal(error.message, 'Authentication request failed.')
        return true
      }
    )
    assert.match(
      getAuthErrorMessage(new AuthApiError({ status: 429, retryAfterSeconds: 125 }), 'fallback'),
      /about 3 minutes/
    )
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('malformed response and network failures become safe authentication errors', async (t) => {
  const originalFetch = globalThis.fetch

  try {
    await t.test('malformed response', async () => {
      globalThis.fetch = async () => createResponse({ invalidJson: true })
      await assert.rejects(
        loginAccount({ email: 'user@example.com', password: 'passphrase' }),
        (error) => {
          assert.ok(error instanceof AuthApiError)
          assert.equal(error.status, 200)
          return true
        }
      )
    })

    await t.test('network failure', async () => {
      globalThis.fetch = async () => {
        throw new Error('private network detail')
      }
      await assert.rejects(
        loginAccount({ email: 'user@example.com', password: 'passphrase' }),
        (error) => {
          assert.ok(error instanceof AuthApiError)
          assert.equal(error.status, null)
          assert.match(getAuthErrorMessage(error, 'fallback'), /could not reach the service/)
          return true
        }
      )
    })
  } finally {
    globalThis.fetch = originalFetch
  }
})
