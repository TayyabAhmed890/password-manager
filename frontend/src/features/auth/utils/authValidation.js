const textEncoder = new TextEncoder()
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const UPPERCASE_REGEX = /\p{Lu}/u
const SPECIAL_CHAR_REGEX = /[\p{P}\p{S}]/u

export const isPasswordWithinByteLimit = (password) => {
  // Har UTF-16 code unit zyada se zyada 3 UTF-8 bytes aur kam se kam 1 byte leta hai.
  // Is liye <= 24 chars hamesha <= 72 bytes aur > 72 chars hamesha > 72 bytes honge (O(1) fast path).
  if (password.length <= 24) return true
  if (password.length > 72) return false
  return textEncoder.encode(password).length <= 72
}

export const passwordsMatch = (password, confirmation) =>
  password === confirmation

export const isValidEmail = (email) =>
  EMAIL_REGEX.test(email)

export const isValidDisplayName = (name) =>
  name.trim().length > 0 && name.trim().length <= 80

export const getPasswordValidationError = (password) => {
  if (!password) {
    return 'required'
  }

  if (password.length < 8) {
    return 'minLength'
  }

  if (!UPPERCASE_REGEX.test(password)) {
    return 'uppercase'
  }

  if (!SPECIAL_CHAR_REGEX.test(password)) {
    return 'specialCharacter'
  }

  if (!isPasswordWithinByteLimit(password)) {
    return 'tooLong'
  }

  return ''
}
