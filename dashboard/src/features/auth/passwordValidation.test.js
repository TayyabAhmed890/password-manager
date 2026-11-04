import test from 'node:test'
import assert from 'node:assert/strict'
import {
  validatePasswordChange,
  validatePasswordReset,
  validateProfileDeletion,
} from './passwordValidation.js'

test('password change flow validates required, matching, and byte-limited passwords', () => {
  assert.equal(validatePasswordChange({
    currentPassword: '',
    newPassword: 'new-password',
    confirmPassword: 'new-password',
  }), 'Enter your current password.')
  assert.equal(validatePasswordChange({
    currentPassword: 'current-password',
    newPassword: 'short',
    confirmPassword: 'short',
  }), 'New password must be at least 8 characters long.')
  assert.equal(validatePasswordChange({
    currentPassword: 'current-password',
    newPassword: 'new-password',
    confirmPassword: 'different-password',
  }), 'The new passwords do not match.')
  assert.equal(validatePasswordChange({
    currentPassword: 'current-password',
    newPassword: 'é'.repeat(37),
    confirmPassword: 'é'.repeat(37),
  }), 'Password is too long. Choose a shorter password.')
  assert.equal(validatePasswordChange({
    currentPassword: 'current-password',
    newPassword: 'A-secure-password',
    confirmPassword: 'A-secure-password',
  }), '')
})

test('password reset flow validates admin identity, recovery code, and new password', () => {
  const valid = {
    email: 'admin@example.com',
    recoveryCode: 'ABCD-EFGH',
    newPassword: 'A-secure-password',
    confirmPassword: 'A-secure-password',
  }

  assert.equal(validatePasswordReset({ ...valid, email: 'not-an-email' }), 'Enter a valid admin email address.')
  assert.equal(validatePasswordReset({ ...valid, recoveryCode: ' ' }), 'Enter the recovery code for this admin account.')
  assert.equal(validatePasswordReset({ ...valid, confirmPassword: 'different-password' }), 'The new passwords do not match.')
  assert.equal(validatePasswordReset(valid), '')
})

test('admin profile deletion requires the current password', () => {
  assert.equal(validateProfileDeletion({
    currentPassword: '',
  }), 'Enter your current password to continue.')
  assert.equal(validateProfileDeletion({
    currentPassword: 'current-password',
  }), '')
})
