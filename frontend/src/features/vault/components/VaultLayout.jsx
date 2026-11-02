import { useState } from 'react'
import {
  ChevronDown,
  CirclePlus,
  KeyRound,
  List,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Trash2,
  X,
  UserRound,
} from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../app/useAuth'
import { AuthApiError, getAuthErrorMessage, logoutAccount } from '../../auth/api/authApi'
import { getDisplayName } from '../../auth/utils/displayName'
import AccountSettingsDialog from './AccountSettingsDialog'
import { useVaultToast } from './useVaultToast.js'

const navItems = [
  { to: '/passwords', label: 'All passwords', icon: List, end: true },
  { to: '/passwords/create', label: 'Add password', icon: CirclePlus },
]

const VaultLayout = () => {
  const navigate = useNavigate()
  const { user, clearAuthenticatedUser } = useAuth()
  const { showToast } = useVaultToast()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true)
  const [settingsMode, setSettingsMode] = useState('')
  const [logoutError, setLogoutError] = useState('')
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const displayName = getDisplayName(user)
  const initials = displayName.slice(0, 1).toUpperCase()

  const handleLogout = async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    setLogoutError('')
    try {
      await logoutAccount()
      clearAuthenticatedUser()
      showToast('You have logged out.')
      navigate('/', { replace: true })
    } catch (error) {
      if (error instanceof AuthApiError && error.status === 401) {
        clearAuthenticatedUser()
        showToast('You have logged out.')
        navigate('/', { replace: true })
        return
      }

      const message = getAuthErrorMessage(
        error,
        'We could not log you out. Please try again.'
      )
      setLogoutError(message)
      showToast(message, 'error')
    } finally {
      setIsLoggingOut(false)
    }
  }

  const navContent = (
    <nav aria-label="Vault navigation" className="space-y-1">
      {navItems.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={() => setIsMobileNavOpen(false)}
          title={isSidebarCollapsed ? label : undefined}
          className={({ isActive }) => `flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition ${
            isSidebarCollapsed ? 'lg:justify-center lg:px-0' : ''
          } ${
            isActive
              ? 'bg-neutral-950 text-white'
              : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950'
          }`}
        >
          <Icon size={18} aria-hidden="true" />
          <span className={isSidebarCollapsed ? 'lg:sr-only' : ''}>{label}</span>
        </NavLink>
      ))}
    </nav>
  )

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-950">
      <aside className={`fixed inset-y-0 left-0 z-20 hidden flex-col border-r border-neutral-200 bg-white py-6 transition-[width,padding] duration-200 lg:flex ${
        isSidebarCollapsed ? 'w-20 px-3' : 'w-64 px-5'
      }`}>
        <div className={`flex min-h-9 items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between gap-2'}`}>
          {!isSidebarCollapsed && (
            <div className="flex min-w-0 items-center gap-2 text-sm font-medium text-neutral-700">
              <UserRound size={17} className="shrink-0 text-neutral-500" aria-hidden="true" />
              <span className="truncate">Hello, {displayName}</span>
            </div>
          )}
          <button
            type="button"
            onClick={() => setIsSidebarCollapsed((collapsed) => !collapsed)}
            aria-label={isSidebarCollapsed ? 'Open sidebar' : 'Close sidebar'}
            aria-expanded={!isSidebarCollapsed}
            title={isSidebarCollapsed ? 'Open sidebar' : 'Close sidebar'}
            className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 transition hover:bg-neutral-50 hover:text-neutral-950"
          >
            {isSidebarCollapsed
              ? <PanelLeftOpen size={17} aria-hidden="true" />
              : <PanelLeftClose size={17} aria-hidden="true" />}
          </button>
        </div>
        <div className="mt-8 border-t border-neutral-200 pt-6">
          <p className={`mb-3 px-3 text-xs font-semibold text-neutral-400 ${isSidebarCollapsed ? 'lg:sr-only' : ''}`}>
            Your vault
          </p>
          {navContent}
        </div>
        <div className={`mt-auto space-y-1 border-t border-neutral-200 pt-4 ${isSidebarCollapsed ? 'lg:hidden' : ''}`}>
          <button
            type="button"
            onClick={() => setSettingsMode('delete-account')}
            className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium text-red-700 transition hover:bg-red-50"
          >
            <Trash2 size={18} aria-hidden="true" />
            Delete profile
          </button>
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoggingOut
              ? <span className="size-4.5 animate-spin rounded-full border-2 border-neutral-400 border-t-transparent" aria-hidden="true" />
              : <LogOut size={18} aria-hidden="true" />}
            {isLoggingOut ? 'Logging out...' : 'Log out'}
          </button>
        </div>
      </aside>

      <div className={`transition-[padding] duration-200 ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/95 backdrop-blur">
          <div className="flex h-18 items-center justify-between gap-4 px-4 sm:px-7">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="flex size-10 items-center justify-center rounded-xl border border-neutral-200 text-neutral-700 lg:hidden"
                aria-label={isMobileNavOpen ? 'Close navigation' : 'Open navigation'}
                aria-expanded={isMobileNavOpen}
                onClick={() => setIsMobileNavOpen((open) => !open)}
              >
                {isMobileNavOpen ? <X size={19} /> : <Menu size={19} />}
              </button>
              <NavLink to="/passwords" aria-label="Keynest vault" className="inline-flex items-center gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-xl bg-neutral-950 text-white">
                  <KeyRound size={18} aria-hidden="true" />
                </span>
                <span className="text-base font-semibold tracking-tight">Keynest</span>
              </NavLink>
              <p className="hidden border-l border-neutral-200 pl-3 text-sm text-neutral-500 sm:block">
                Your personal password vault
              </p>
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setIsProfileOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={isProfileOpen}
                className="inline-flex min-h-10 items-center gap-2 rounded-full border border-neutral-200 bg-white py-1 pl-1 pr-3 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
              >
                <span className="flex size-8 items-center justify-center rounded-full bg-neutral-950 text-xs font-semibold text-white">
                  {initials}
                </span>
                <span className="hidden max-w-48 truncate sm:block">{displayName}</span>
                <ChevronDown size={15} aria-hidden="true" />
              </button>
              {isProfileOpen && (
                <div role="menu" className="absolute right-0 top-full mt-2 w-60 rounded-2xl border border-neutral-200 bg-white p-2 shadow-xl">
                  <p className="truncate px-3 py-2 text-sm font-medium text-neutral-800 sm:hidden">{displayName}</p>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setSettingsMode('change-password')
                      setIsProfileOpen(false)
                    }}
                    className="flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-sm text-neutral-700 hover:bg-neutral-100"
                  >
                    <Settings size={16} aria-hidden="true" />
                    Change password
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setSettingsMode('delete-account')
                      setIsProfileOpen(false)
                    }}
                    className="flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-sm text-red-700 hover:bg-red-50"
                  >
                    <Trash2 size={16} aria-hidden="true" />
                    Delete profile
                  </button>
                  <div className="my-1 border-t border-neutral-100" />
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-sm text-neutral-700 hover:bg-neutral-100 disabled:opacity-60"
                  >
                    {isLoggingOut
                      ? <span className="size-4 animate-spin rounded-full border-2 border-neutral-400 border-t-transparent" aria-hidden="true" />
                      : <LogOut size={16} aria-hidden="true" />}
                    {isLoggingOut ? 'Logging out...' : 'Log out'}
                  </button>
                </div>
              )}
            </div>
          </div>
          <div
            className={`grid overflow-hidden transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none lg:hidden ${
              isMobileNavOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
            }`}
            aria-hidden={!isMobileNavOpen}
            inert={!isMobileNavOpen}
          >
            <div className="min-h-0 overflow-hidden">
              <div className="border-t border-neutral-200 px-4 py-3">
                {navContent}
              </div>
            </div>
          </div>
        </header>

        {logoutError && (
          <p role="alert" className="mx-4 mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 sm:mx-7">
            {logoutError}
          </p>
        )}
        <main className="mx-auto w-full max-w-6xl px-4 py-7 sm:px-7 sm:py-9">
          <Outlet />
        </main>
      </div>

      {settingsMode && (
        <AccountSettingsDialog
          mode={settingsMode}
          onClose={() => setSettingsMode('')}
        />
      )}
    </div>
  )
}

export default VaultLayout
