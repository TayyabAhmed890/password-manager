import { useContext } from 'react'
import VaultToastContext from './vaultToastContext.js'

export const useVaultToast = () => {
  const context = useContext(VaultToastContext)
  if (!context) {
    throw new Error('useVaultToast must be used inside VaultToastProvider.')
  }
  return context
}
