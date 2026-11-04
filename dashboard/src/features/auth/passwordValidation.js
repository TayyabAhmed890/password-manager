const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

const isValidPasswordLength = (password) =>
  typeof password === 'string' &&
  password.length >= 8 &&
  new TextEncoder().encode(password).length <= 72

export const validatePasswordChange = ({ currentPassword, newPassword, confirmPassword }) => {
  if (!currentPassword) return 'Enter your current password.'
  if (typeof newPassword !== 'string' || newPassword.length < 8) {
    return 'New password must be at least 8 characters long.'
  }
  if (new TextEncoder().encode(newPassword).length > 72) {
    return 'Password is too long. Choose a shorter password.'
  }
  if (newPassword !== confirmPassword) return 'The new passwords do not match.'
  return ''
}

export const validatePasswordReset = ({ email, recoveryCode, newPassword, confirmPassword }) => {
  if (typeof email !== 'string' || !isValidEmail(email.trim())) {
    return 'Enter a valid admin email address.'
  }
  if (typeof recoveryCode !== 'string' || !recoveryCode.trim()) {
    return 'Enter the recovery code for this admin account.'
  }
  if (!isValidPasswordLength(newPassword)) {
    return typeof newPassword !== 'string' || newPassword.length < 8
      ? 'New password must be at least 8 characters long.'
      : 'Password is too long. Choose a shorter password.'
  }
  if (newPassword !== confirmPassword) return 'The new passwords do not match.'
  return ''
}

export const validateProfileDeletion = ({ currentPassword }) =>
  currentPassword ? '' : 'Enter your current password to continue.'
