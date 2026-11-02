import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getPasswordValidationError,
  isValidEmail,
  isValidDisplayName,
  isPasswordWithinByteLimit,
  passwordsMatch,
} from '../src/features/auth/utils/authValidation.js'

test('password byte limit handles ASCII and multibyte characters', () => {
  assert.equal(isPasswordWithinByteLimit('a'.repeat(72)), true)
  assert.equal(isPasswordWithinByteLimit('a'.repeat(73)), false)
  assert.equal(isPasswordWithinByteLimit('é'.repeat(36)), true)
  assert.equal(isPasswordWithinByteLimit('é'.repeat(37)), false)
  assert.equal(isPasswordWithinByteLimit('🔐'.repeat(18)), true)
  assert.equal(isPasswordWithinByteLimit('🔐'.repeat(19)), false)
})

test('password confirmation requires an exact match', () => {
  assert.equal(passwordsMatch('correct horse', 'correct horse'), true)
  assert.equal(passwordsMatch('correct horse', 'Correct horse'), false)
  assert.equal(passwordsMatch('password', ''), false)
})

test('new passwords require minimum length, uppercase, and special character', () => {
  assert.equal(getPasswordValidationError(''), 'required')
  assert.equal(getPasswordValidationError('Ab1!'), 'minLength')
  assert.equal(getPasswordValidationError('lowercase1!'), 'uppercase')
  assert.equal(getPasswordValidationError('Uppercase1'), 'specialCharacter')
  assert.equal(getPasswordValidationError('GoodPass1!'), '')
  assert.equal(getPasswordValidationError(`${'A'.repeat(72)}!`), 'tooLong')
  assert.equal(getPasswordValidationError('ÉclairÉclair!'), '')
})

test('email validation accepts common addresses and rejects malformed values', () => {
  assert.equal(isValidEmail('person@example.com'), true)
  assert.equal(isValidEmail('person+tag@example.co.uk'), true)
  assert.equal(isValidEmail(''), false)
  assert.equal(isValidEmail('missing-at-sign.example.com'), false)
  assert.equal(isValidEmail('person @example.com'), false)
})

test('display name validation trims input and enforces the supported length', () => {
  assert.equal(isValidDisplayName('  Amina Rahman  '), true)
  assert.equal(isValidDisplayName('   '), false)
  assert.equal(isValidDisplayName('a'.repeat(81)), false)
})
