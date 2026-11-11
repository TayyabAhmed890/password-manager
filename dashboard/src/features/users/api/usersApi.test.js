import test from 'node:test'
import assert from 'node:assert/strict'
import { ApiError } from '../../../shared/lib/apiClient.js'
import { getUsers } from './usersApi.js'

const createResponse = (body, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
})

const validPayload = {
  success: true,
  data: [{
    id: 'user-1',
    email: 'user@example.com',
    createdAt: '2026-01-01T00:00:00.000Z',
    passwordCount: 2,
  }],
  pagination: {
    page: 1,
    limit: 10,
    totalUsers: 1,
    totalPages: 1,
  },
}

test('getUsers returns valid paginated user data', async () => {
  const originalFetch = globalThis.fetch
  let requestedUrl
  globalThis.fetch = async (url) => {
    requestedUrl = url
    return createResponse(validPayload)
  }

  try {
    assert.deepEqual(await getUsers({ page: 1, limit: 10 }), validPayload)
    assert.equal(requestedUrl, '/api/admin/users?page=1&limit=10')
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('getUsers rejects malformed user fields and pagination as an API error', async (t) => {
  const originalFetch = globalThis.fetch
  const invalidPayloads = [
    {
      ...validPayload,
      data: [{ ...validPayload.data[0], passwordCount: '2' }],
    },
    {
      ...validPayload,
      data: [{ ...validPayload.data[0], email: null }],
    },
    {
      ...validPayload,
      pagination: { ...validPayload.pagination, totalUsers: '1' },
    },
    {
      ...validPayload,
      pagination: { ...validPayload.pagination, totalPages: 0 },
    },
    {
      ...validPayload,
      data: Array(11).fill(validPayload.data[0]),
    },
  ]

  try {
    for (const payload of invalidPayloads) {
      await t.test('rejects invalid response shape', async () => {
        globalThis.fetch = async () => createResponse(payload)
        await assert.rejects(getUsers({ page: 1, limit: 10 }), (error) => {
          assert.ok(error instanceof ApiError)
          assert.equal(error.status, 200)
          assert.equal(error.message, 'The service returned an unexpected response.')
          return true
        })
      })
    }

    await t.test('accepts a valid empty result', async () => {
      globalThis.fetch = async () => createResponse({
        success: true,
        data: [],
        pagination: { page: 1, limit: 10, totalUsers: 0, totalPages: 0 },
      })
      const result = await getUsers({ page: 1, limit: 10 })
      assert.deepEqual(result.data, [])
      assert.equal(result.pagination.totalUsers, 0)
    })
  } finally {
    globalThis.fetch = originalFetch
  }
})
