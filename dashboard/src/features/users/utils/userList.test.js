import test from 'node:test'
import assert from 'node:assert/strict'
import {
  filterUsersOnPage,
  formatAccountDate,
  getPaginationState,
} from './userList.js'

const users = [
  { email: 'alex@example.com' },
  { email: 'Sam@Example.com' },
  { email: 'kim@example.org' },
]

test('filters only current-page users by case-insensitive email', () => {
  assert.deepEqual(filterUsersOnPage(users, '  EXAMPLE.COM '), users.slice(0, 2))
  assert.deepEqual(filterUsersOnPage(users, 'missing'), [])
  assert.deepEqual(filterUsersOnPage(users, '  '), users)
  assert.deepEqual(filterUsersOnPage(null, 'alex'), [])
  assert.deepEqual(filterUsersOnPage([{ email: null }, null], 'alex'), [])
})

test('clamps pagination values and derives navigation availability', () => {
  assert.deepEqual(getPaginationState({ page: 0, totalPages: 4 }), {
    currentPage: 1,
    canGoPrevious: false,
    canGoNext: true,
  })
  assert.deepEqual(getPaginationState({ page: 8, totalPages: 4 }), {
    currentPage: 4,
    canGoPrevious: true,
    canGoNext: false,
  })
  assert.deepEqual(getPaginationState({ page: 1, totalPages: 0 }), {
    currentPage: 1,
    canGoPrevious: false,
    canGoNext: false,
  })
  assert.deepEqual(getPaginationState({ page: Number.NaN, totalPages: Number.NaN }), {
    currentPage: 1,
    canGoPrevious: false,
    canGoNext: false,
  })
})

test('formats valid dates and handles malformed date values', () => {
  assert.equal(formatAccountDate('not-a-date'), 'Date unavailable')
  assert.equal(formatAccountDate(null), 'Date unavailable')
  assert.notEqual(formatAccountDate('2025-01-15T00:00:00.000Z'), 'Date unavailable')
})
