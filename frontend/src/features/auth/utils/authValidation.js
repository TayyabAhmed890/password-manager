export const isPasswordWithinByteLimit = (password) =>
  new TextEncoder().encode(password).length <= 72

export const passwordsMatch = (password, confirmation) =>
  password === confirmation

export const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

export const isValidDisplayName = (name) =>
  name.trim().length > 0 && name.trim().length <= 80

export const getPasswordValidationError = (password) => {
  if (!password) {
    return 'required'
  }

  if (password.length < 8) {
    return 'minLength'
  }

  if (!/\p{Lu}/u.test(password)) {
    return 'uppercase'
  }

  if (!/[\p{P}\p{S}]/u.test(password)) {
    return 'specialCharacter'
  }

  if (!isPasswordWithinByteLimit(password)) {
    return 'tooLong'
  }

  return ''
}
