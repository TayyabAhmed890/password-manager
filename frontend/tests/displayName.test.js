import assert from 'node:assert/strict'
import test from 'node:test'
import { getDisplayName } from '../src/features/auth/utils/displayName.js'

test('profile display prefers the saved name and never exposes the email', () => {
  assert.equal(
    getDisplayName({ name: 'Amina Rahman', email: 'amina@example.com' }),
    'Amina Rahman'
  )
})

test('legacy accounts receive a readable name from the email prefix', () => {
  assert.equal(
    getDisplayName({ email: 'amina.rahman+vault@example.com' }),
    'amina rahman vault'
  )
  assert.equal(getDisplayName({ email: '' }), 'Account')
  assert.equal(getDisplayName(null), 'Account')
})
